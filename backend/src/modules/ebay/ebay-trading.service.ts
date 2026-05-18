import axios from 'axios';
import { EbayXmlUtils } from './ebay-xml.utils';
import { prisma } from '../../lib/prisma';
import { decrypt } from '../../lib/encryption';

const EBAY_TRADING_URLS = {
  sandbox: 'https://api.sandbox.ebay.com/ws/api.dll',
  production: 'https://api.ebay.com/ws/api.dll',
};

const COMPATIBILITY_LEVEL = '1421';

const EBAY_SITE_IDS: Record<string, number> = {
  EBAY_US: 0,
  EBAY_GB: 3,
  EBAY_DE: 77,
  EBAY_FR: 71,
  EBAY_IT: 101,
  EBAY_ES: 186,
  EBAY_CA: 2,
  EBAY_AU: 15,
  EBAY_IN: 201,
};

export interface TradingApiResponse {
  Ack: string;
  Timestamp?: string;
  Build?: string;
  Version?: string;
  Errors?: TradingApiError | TradingApiError[];
  [key: string]: any;
}

export interface TradingApiError {
  ShortMessage?: string;
  LongMessage?: string;
  ErrorCode?: string;
  SeverityCode?: string;
  ErrorClassification?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  pageNumber: number;
  entriesPerPage: number;
  totalEntries: number;
  totalPages: number;
}

export class EbayTradingApiError extends Error {
  constructor(
    message: string,
    public code?: string,
    public severity?: string,
    public details?: TradingApiError[],
  ) {
    super(message);
    this.name = 'EbayTradingApiError';
  }
}

export class EbayTradingService {
  private workspaceId: string;

  constructor(workspaceId: string) {
    this.workspaceId = workspaceId;
  }

  private async getAccount() {
    const account = await prisma.ebayAccount.findFirst({
      where: { workspaceId: this.workspaceId, isActive: true },
    });
    if (!account) {
      throw new Error('eBay account not found');
    }
    return account;
  }

  private async getToken(): Promise<{ token: string; isSandbox: boolean; siteId: number }> {
    const account = await this.getAccount();
    const token = decrypt(account.accessToken);
    const siteId = EBAY_SITE_IDS[account.marketplace] ?? 3;
    return { token, isSandbox: account.isSandbox, siteId };
  }

  async request<T>(callName: string, body: Record<string, any>): Promise<T> {
    const { token, isSandbox, siteId } = await this.getToken();
    const endpoint = isSandbox ? EBAY_TRADING_URLS.sandbox : EBAY_TRADING_URLS.production;

    const xml = EbayXmlUtils.buildTradingRequest(callName, body, token);

    const response = await axios.post(endpoint, xml, {
      headers: {
        'X-EBAY-API-IAF-TOKEN': token,
        'X-EBAY-API-SITEID': String(siteId),
        'X-EBAY-API-COMPATIBILITY-LEVEL': COMPATIBILITY_LEVEL,
        'X-EBAY-API-CALL-NAME': callName,
        'Content-Type': 'text/xml',
      },
      timeout: 60000,
    });

    const parsed = await EbayXmlUtils.parseResponse<TradingApiResponse>(response.data);
    const rootKey = `${callName}Response`;
    const result = parsed[rootKey] as T & TradingApiResponse;

    if (!result) {
      throw new EbayTradingApiError(`Invalid response from eBay Trading API (${callName})`);
    }

    if (result.Ack === 'Failure' || result.Ack === 'Warning') {
      const errors = Array.isArray(result.Errors) ? result.Errors : result.Errors ? [result.Errors] : [];
      const messages = errors.map((e) => e.LongMessage || e.ShortMessage || 'Unknown error').join('; ');
      throw new EbayTradingApiError(
        `eBay Trading API error (${callName}): ${messages}`,
        errors[0]?.ErrorCode,
        errors[0]?.SeverityCode,
        errors,
      );
    }

    return result;
  }

  async requestWithPagination<T>(
    callName: string,
    listKey: string,
    itemsKey: string,
    baseBody: Record<string, any>,
    options?: { entriesPerPage?: number; maxPages?: number },
  ): Promise<PaginatedResponse<T>> {
    const entriesPerPage = options?.entriesPerPage ?? 100;
    const maxPages = options?.maxPages ?? 10;

    const body = {
      ...baseBody,
      Pagination: {
        EntriesPerPage: String(entriesPerPage),
        PageNumber: '1',
      },
    };

    const response = await this.request<any>(callName, body);
    const listContainer = response[listKey];

    if (!listContainer) {
      return { items: [], pageNumber: 1, entriesPerPage, totalEntries: 0, totalPages: 0 };
    }

    const pagination = listContainer.PaginationResult;
    const totalEntries = parseInt(pagination?.TotalNumberOfEntries ?? '0');
    const totalPages = parseInt(pagination?.TotalNumberOfPages ?? '0');

    let items = listContainer.ItemArray?.Item ?? [];
    if (!Array.isArray(items)) {
      items = items ? [items] : [];
    }

    if (totalPages > 1 && maxPages > 1) {
      const pagesToFetch = Math.min(totalPages, maxPages) - 1;
      for (let page = 2; page <= pagesToFetch + 1; page++) {
        try {
          const pageBody = {
            ...baseBody,
            Pagination: {
              EntriesPerPage: String(entriesPerPage),
              PageNumber: String(page),
            },
          };
          const pageResponse = await this.request<any>(callName, pageBody);
          const pageList = pageResponse[listKey];
          if (pageList?.ItemArray?.Item) {
            const pageItems = Array.isArray(pageList.ItemArray.Item)
              ? pageList.ItemArray.Item
              : [pageList.ItemArray.Item];
            items = items.concat(pageItems);
          }
        } catch (error) {
          console.error(`Failed to fetch page ${page} for ${callName}:`, error);
          break;
        }
      }
    }

    return {
      items: items as T[],
      pageNumber: 1,
      entriesPerPage,
      totalEntries,
      totalPages,
    };
  }

  async getMyeBaySelling(options?: {
    includeActive?: boolean;
    includeSold?: boolean;
    includeUnsold?: boolean;
    includeScheduled?: boolean;
    includeSummary?: boolean;
    entriesPerPage?: number;
    page?: number;
    durationInDays?: number;
    sort?: string;
  }) {
    const body: Record<string, any> = {
      DetailLevel: 'ReturnAll',
      WarningLevel: 'High',
    };

    const entriesPerPage = options?.entriesPerPage ?? 100;
    const page = options?.page ?? 1;

    if (options?.includeActive !== false) {
      body.ActiveList = {
        Include: 'true',
        IncludeNotes: 'true',
        Pagination: {
          EntriesPerPage: String(entriesPerPage),
          PageNumber: String(page),
        },
        Sort: options?.sort ?? 'TimeLeft',
      };
    }

    if (options?.includeSold) {
      body.SoldList = {
        Include: 'true',
        IncludeNotes: 'true',
        DurationInDays: String(options?.durationInDays ?? 30),
        Pagination: {
          EntriesPerPage: String(entriesPerPage),
          PageNumber: String(page),
        },
      };
    }

    if (options?.includeUnsold) {
      body.UnsoldList = {
        Include: 'true',
        IncludeNotes: 'true',
        DurationInDays: String(options?.durationInDays ?? 30),
        Pagination: {
          EntriesPerPage: String(entriesPerPage),
          PageNumber: String(page),
        },
      };
    }

    if (options?.includeScheduled) {
      body.ScheduledList = {
        Include: 'true',
        Pagination: {
          EntriesPerPage: String(entriesPerPage),
          PageNumber: String(page),
        },
      };
    }

    if (options?.includeSummary) {
      body.SellingSummary = {
        Include: 'true',
      };
    }

    return this.request<any>('GetMyeBaySelling', body);
  }

  async getActiveListings(options?: {
    entriesPerPage?: number;
    page?: number;
    sort?: string;
  }): Promise<PaginatedResponse<any>> {
    return this.requestWithPagination(
      'GetMyeBaySelling',
      'ActiveList',
      'Item',
      {
        DetailLevel: 'ReturnAll',
        ActiveList: {
          Include: 'true',
          IncludeNotes: 'true',
          Sort: options?.sort ?? 'TimeLeft',
        },
      },
      {
        entriesPerPage: options?.entriesPerPage ?? 100,
        maxPages: 5,
      },
    );
  }

  async getSoldListings(options?: {
    entriesPerPage?: number;
    page?: number;
    durationInDays?: number;
  }): Promise<PaginatedResponse<any>> {
    return this.requestWithPagination(
      'GetMyeBaySelling',
      'SoldList',
      'Item',
      {
        DetailLevel: 'ReturnAll',
        SoldList: {
          Include: 'true',
          IncludeNotes: 'true',
          DurationInDays: String(options?.durationInDays ?? 30),
        },
      },
      {
        entriesPerPage: options?.entriesPerPage ?? 100,
        maxPages: 5,
      },
    );
  }

  async getUnsoldListings(options?: {
    entriesPerPage?: number;
    page?: number;
    durationInDays?: number;
  }): Promise<PaginatedResponse<any>> {
    return this.requestWithPagination(
      'GetMyeBaySelling',
      'UnsoldList',
      'Item',
      {
        DetailLevel: 'ReturnAll',
        UnsoldList: {
          Include: 'true',
          IncludeNotes: 'true',
          DurationInDays: String(options?.durationInDays ?? 30),
        },
      },
      {
        entriesPerPage: options?.entriesPerPage ?? 100,
        maxPages: 5,
      },
    );
  }

  async getScheduledListings(options?: {
    entriesPerPage?: number;
    page?: number;
  }): Promise<PaginatedResponse<any>> {
    return this.requestWithPagination(
      'GetMyeBaySelling',
      'ScheduledList',
      'Item',
      {
        DetailLevel: 'ReturnAll',
        ScheduledList: {
          Include: 'true',
        },
      },
      {
        entriesPerPage: options?.entriesPerPage ?? 100,
        maxPages: 3,
      },
    );
  }

  async getSellingSummary() {
    const response = await this.request<any>('GetMyeBaySelling', {
      DetailLevel: 'ReturnSummary',
      SellingSummary: {
        Include: 'true',
      },
    });
    return response.SellingSummary ?? response.Summary ?? {};
  }

  async getOrders(options?: {
    entriesPerPage?: number;
    page?: number;
    numberOfDays?: number;
    statusFilter?: string;
    includeOrderLineItemArray?: boolean;
  }) {
    const now = new Date();
    const from = new Date();
    from.setDate(from.getDate() - (options?.numberOfDays ?? 30));

    const body: Record<string, any> = {
      DetailLevel: 'ReturnAll',
      WarningLevel: 'High',
      CreateTimeFrom: from.toISOString(),
      CreateTimeTo: now.toISOString(),
      Pagination: {
        EntriesPerPage: String(options?.entriesPerPage ?? 100),
        PageNumber: String(options?.page ?? 1),
      },
    };

    if (options?.statusFilter) {
      body.OrderStatus = options.statusFilter;
    }

    if (options?.includeOrderLineItemArray !== false) {
      body.IncludeContainingOrder = 'true';
    }

    return this.request<any>('GetOrders', body);
  }

  async getOrder(orderId: string) {
    return this.request<any>('GetOrders', {
      DetailLevel: 'ReturnAll',
      OrderIDArray: {
        OrderID: orderId,
      },
    });
  }

  async getItem(itemId: string, options?: {
    includeWatchCount?: boolean;
    includeItemSpecifics?: boolean;
    includeTaxTable?: boolean;
    includeItemCompatibilityList?: boolean;
  }) {
    const body: Record<string, any> = {
      ItemID: itemId,
      DetailLevel: 'ReturnAll',
      WarningLevel: 'High',
    };

    if (options?.includeWatchCount) {
      body.IncludeWatchCount = 'true';
    }

    if (options?.includeItemSpecifics !== false) {
      body.IncludeItemSpecifics = 'true';
    }

    if (options?.includeTaxTable) {
      body.IncludeTaxTable = 'true';
    }

    if (options?.includeItemCompatibilityList) {
      body.IncludeItemCompatibilityList = 'true';
    }

    return this.request<any>('GetItem', body);
  }

  async getItemBySku(sku: string) {
    return this.request<any>('GetItem', {
      SKU: sku,
      DetailLevel: 'ReturnAll',
      WarningLevel: 'High',
    });
  }

  async getSellerListings(options?: {
    entriesPerPage?: number;
    page?: number;
    granularityLevel?: string;
  }) {
    const now = new Date();
    const future = new Date();
    future.setMonth(future.getMonth() + 3);

    const body: Record<string, any> = {
      DetailLevel: 'ReturnAll',
      WarningLevel: 'High',
      EndTimeFrom: now.toISOString(),
      EndTimeTo: future.toISOString(),
      GranularityLevel: options?.granularityLevel ?? 'Fine',
      Pagination: {
        EntriesPerPage: String(options?.entriesPerPage ?? 50),
        PageNumber: String(options?.page ?? 1),
      },
    };

    return this.requestWithPagination(
      'GetSellerList',
      'ItemArray',
      'Item',
      body,
      {
        entriesPerPage: options?.entriesPerPage ?? 50,
        maxPages: 10,
      },
    );
  }

  async getItemTransactions(itemId: string, options?: {
    entriesPerPage?: number;
    page?: number;
    numberOfDays?: number;
  }) {
    const now = new Date();
    const from = new Date();
    from.setDate(from.getDate() - (options?.numberOfDays ?? 30));

    const body: Record<string, any> = {
      ItemID: itemId,
      DetailLevel: 'ReturnAll',
      WarningLevel: 'High',
      ModTimeFrom: from.toISOString(),
      ModTimeTo: now.toISOString(),
      Pagination: {
        EntriesPerPage: String(options?.entriesPerPage ?? 100),
        PageNumber: String(options?.page ?? 1),
      },
    };

    return this.request<any>('GetItemTransactions', body);
  }

  async getSellerTransactions(options?: {
    entriesPerPage?: number;
    page?: number;
    numberOfDays?: number;
  }) {
    const now = new Date();
    const from = new Date();
    from.setDate(from.getDate() - (options?.numberOfDays ?? 30));

    const body: Record<string, any> = {
      DetailLevel: 'ReturnAll',
      WarningLevel: 'High',
      ModTimeFrom: from.toISOString(),
      ModTimeTo: now.toISOString(),
      Pagination: {
        EntriesPerPage: String(options?.entriesPerPage ?? 100),
        PageNumber: String(options?.page ?? 1),
      },
    };

    return this.request<any>('GetSellerTransactions', body);
  }

  async addItem(item: {
    title: string;
    description: string;
    primaryCategory: string;
    startPrice: number;
    buyItNowPrice?: number;
    quantity: number;
    duration?: string;
    listingType?: string;
    conditionId?: number;
    sku?: string;
    pictureUrls?: string[];
    itemSpecifics?: Array<{ name: string; value: string[] }>;
    shippingDetails?: any;
    paymentMethods?: Array<{ type: string; value?: string }>;
    returnPolicy?: any;
    location?: string;
    country?: string;
    postalCode?: string;
  }) {
    const body: Record<string, any> = {
      ErrorLanguage: 'en_GB',
      WarningLevel: 'High',
      Item: {
        Title: item.title,
        Description: `<div>${item.description}</div>`,
        PrimaryCategory: {
          CategoryID: item.primaryCategory,
        },
        StartPrice: String(item.startPrice),
        Quantity: String(item.quantity),
        ListingDuration: item.duration ?? 'Days_30',
        ListingType: item.listingType ?? 'FixedPriceItem',
        ConditionID: String(item.conditionId ?? 1000),
        Country: item.country ?? 'GB',
        Location: item.location ?? 'United Kingdom',
      },
    };

    if (item.buyItNowPrice) {
      body.Item.BuyItNowPrice = String(item.buyItNowPrice);
    }

    if (item.sku) {
      body.Item.SKU = item.sku;
    }

    if (item.pictureUrls && item.pictureUrls.length > 0) {
      body.Item.PictureDetails = {
        PictureURL: item.pictureUrls,
      };
    }

    if (item.itemSpecifics && item.itemSpecifics.length > 0) {
      body.Item.ItemSpecifics = {
        NameValueList: item.itemSpecifics.map((spec) => ({
          Name: spec.name,
          Value: spec.value,
        })),
      };
    }

    if (item.paymentMethods && item.paymentMethods.length > 0) {
      body.Item.PaymentMethods = item.paymentMethods.map((pm) => ({
        PaymentMethod: pm.type,
        ...(pm.value && { PayPalEmailAddress: pm.value }),
      }));
    }

    if (item.shippingDetails) {
      body.Item.ShippingDetails = item.shippingDetails;
    }

    if (item.returnPolicy) {
      body.Item.ReturnPolicy = item.returnPolicy;
    }

    return this.request<any>('AddItem', body);
  }

  async addFixedPriceItem(item: {
    sku: string;
    title: string;
    description: string;
    primaryCategory: string;
    price: number;
    quantity: number;
    conditionId?: number;
    pictureUrls?: string[];
    itemSpecifics?: Array<{ name: string; value: string[] }>;
    shippingDetails?: any;
    returnPolicy?: any;
    location?: string;
  }) {
    const body: Record<string, any> = {
      ErrorLanguage: 'en_GB',
      WarningLevel: 'High',
      Item: {
        Title: item.title,
        Description: `<div>${item.description}</div>`,
        SKU: item.sku,
        PrimaryCategory: {
          CategoryID: item.primaryCategory,
        },
        StartPrice: String(item.price),
        BuyItNowPrice: String(item.price),
        Quantity: String(item.quantity),
        ListingDuration: 'GTC',
        ListingType: 'FixedPriceItem',
        ConditionID: String(item.conditionId ?? 1000),
        Country: 'GB',
        Location: item.location ?? 'United Kingdom',
      },
    };

    if (item.pictureUrls && item.pictureUrls.length > 0) {
      body.Item.PictureDetails = {
        PictureURL: item.pictureUrls,
      };
    }

    if (item.itemSpecifics && item.itemSpecifics.length > 0) {
      body.Item.ItemSpecifics = {
        NameValueList: item.itemSpecifics.map((spec) => ({
          Name: spec.name,
          Value: spec.value,
        })),
      };
    }

    if (item.shippingDetails) {
      body.Item.ShippingDetails = item.shippingDetails;
    }

    if (item.returnPolicy) {
      body.Item.ReturnPolicy = item.returnPolicy;
    }

    return this.request<any>('AddFixedPriceItem', body);
  }

  async reviseItem(itemId: string, revisions: {
    title?: string;
    description?: string;
    price?: number;
    quantity?: number;
    pictureUrls?: string[];
    itemSpecifics?: Array<{ name: string; value: string[] }>;
    shippingDetails?: any;
    returnPolicy?: any;
    subtitle?: string;
  }) {
    const body: Record<string, any> = {
      ErrorLanguage: 'en_GB',
      WarningLevel: 'High',
      Item: {
        ItemID: itemId,
      },
    };

    if (revisions.title) {
      body.Item.Title = revisions.title;
    }

    if (revisions.description) {
      body.Item.Description = `<div>${revisions.description}</div>`;
    }

    if (revisions.price) {
      body.Item.StartPrice = String(revisions.price);
      body.Item.BuyItNowPrice = String(revisions.price);
    }

    if (revisions.quantity !== undefined) {
      body.Item.Quantity = String(revisions.quantity);
    }

    if (revisions.subtitle) {
      body.Item.SubTitle = revisions.subtitle;
    }

    if (revisions.pictureUrls && revisions.pictureUrls.length > 0) {
      body.Item.PictureDetails = {
        PictureURL: revisions.pictureUrls,
      };
    }

    if (revisions.itemSpecifics && revisions.itemSpecifics.length > 0) {
      body.Item.ItemSpecifics = {
        NameValueList: revisions.itemSpecifics.map((spec) => ({
          Name: spec.name,
          Value: spec.value,
        })),
      };
    }

    if (revisions.shippingDetails) {
      body.Item.ShippingDetails = revisions.shippingDetails;
    }

    if (revisions.returnPolicy) {
      body.Item.ReturnPolicy = revisions.returnPolicy;
    }

    return this.request<any>('ReviseItem', body);
  }

  async reviseFixedPriceQuantity(itemId: string, sku: string, quantity: number) {
    return this.request<any>('ReviseInventoryStatus', {
      InventoryStatus: {
        ItemID: itemId,
        SKU: sku,
        Quantity: String(quantity),
      },
    });
  }

  async endItem(itemId: string, reason: string = 'NotSpecified') {
    return this.request<any>('EndItem', {
      ItemID: itemId,
      EndingReason: reason,
    });
  }

  async endItems(itemIds: string[], reason: string = 'NotSpecified') {
    return this.request<any>('EndItems', {
      Item: itemIds.map((id) => ({
        ItemID: id,
        EndingReason: reason,
      })),
    });
  }

  async relistItem(itemId: string) {
    return this.request<any>('RelistItem', {
      Item: {
        ItemID: itemId,
      },
    });
  }

  async verifyAddItem(item: {
    title: string;
    description: string;
    primaryCategory: string;
    startPrice: number;
    quantity: number;
    conditionId?: number;
    sku?: string;
    pictureUrls?: string[];
  }) {
    const body: Record<string, any> = {
      ErrorLanguage: 'en_GB',
      WarningLevel: 'High',
      Item: {
        Title: item.title,
        Description: `<div>${item.description}</div>`,
        PrimaryCategory: {
          CategoryID: item.primaryCategory,
        },
        StartPrice: String(item.startPrice),
        Quantity: String(item.quantity),
        ListingDuration: 'Days_30',
        ListingType: 'FixedPriceItem',
        ConditionID: String(item.conditionId ?? 1000),
        Country: 'GB',
        Location: 'United Kingdom',
      },
    };

    if (item.sku) {
      body.Item.SKU = item.sku;
    }

    if (item.pictureUrls && item.pictureUrls.length > 0) {
      body.Item.PictureDetails = {
        PictureURL: item.pictureUrls,
      };
    }

    return this.request<any>('VerifyAddItem', body);
  }

  async getCategories(options?: {
    categoryId?: string;
    levelLimit?: number;
    viewAllNodes?: boolean;
  }) {
    const body: Record<string, any> = {
      DetailLevel: 'ReturnAll',
      CategorySiteID: '3',
    };

    if (options?.categoryId) {
      body.CategoryParentID = options.categoryId;
    }

    if (options?.levelLimit) {
      body.LevelLimit = String(options.levelLimit);
    }

    if (options?.viewAllNodes) {
      body.ViewAllNodes = 'true';
    }

    return this.request<any>('GetCategories', body);
  }

  async getUserDetails(userId?: string) {
    const body: Record<string, any> = {
      DetailLevel: 'ReturnAll',
      LevelLimit: '1',
    };

    if (userId) {
      body.UserID = userId;
    }

    return this.request<any>('GetUser', body);
  }

  async getAccountSummary() {
    return this.request<any>('GetAccount', {});
  }

  async completeSale(orderId: string, shipped: boolean = true, paid: boolean = true) {
    return this.request<any>('CompleteSale', {
      OrderID: orderId,
      Shipped: shipped ? 'true' : 'false',
      Paid: paid ? 'true' : 'false',
    });
  }

  async addDispatchTime(orderId: string, dispatchTime: Date) {
    return this.request<any>('AddDispatchTime', {
      OrderID: orderId,
      DispatchTime: dispatchTime.toISOString(),
    });
  }

  async uploadSiteHostedPictures(pictureUrls: string[]) {
    return this.request<any>('UploadSiteHostedPictures', {
      PictureURL: pictureUrls,
    });
  }

  async geteBayOfficialTime() {
    return this.request<any>('GeteBayOfficialTime', {});
  }
}
