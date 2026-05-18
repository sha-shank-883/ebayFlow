import { Builder, Parser } from 'xml2js';

export class EbayXmlUtils {
  private static builder = new Builder({
    renderOpts: { pretty: false },
    headless: true,
    rootName: undefined,
    xmldec: { version: '1.0', encoding: 'utf-8' },
  });

  private static parser = new Parser({
    explicitArray: false,
    ignoreAttrs: false,
    attrkey: '$',
    charkey: '_',
    trim: true,
    normalize: true,
  });

  static buildTradingRequest(callName: string, body: Record<string, any>, token: string): string {
    const request: Record<string, any> = {
      $: { xmlns: 'urn:ebay:apis:eBLBaseComponents' },
      RequesterCredentials: {
        eBayAuthToken: token,
      },
      ...body,
    };

    const xml = this.builder.buildObject({ [`${callName}Request`]: request });
    return `<?xml version="1.0" encoding="utf-8"?>${xml}`;
  }

  static async parseResponse<T>(xml: string): Promise<T> {
    return (await this.parser.parseStringPromise(xml)) as T;
  }

  static parseItemData(item: any): any {
    if (!item) return null;

    const parsePrice = (val: any): number => {
      if (!val) return 0;
      if (typeof val === 'object' && val._ !== undefined) return parseFloat(val._) || 0;
      return parseFloat(val) || 0;
    };

    const parseNumber = (val: any): number => {
      if (!val) return 0;
      if (typeof val === 'object' && val._ !== undefined) return parseInt(val._) || 0;
      return parseInt(val) || 0;
    };

    const parseDate = (val: any): string | null => {
      if (!val) return null;
      if (typeof val === 'object' && val._ !== undefined) return val._;
      return String(val);
    };

    const parseSpecifics = (specifics: any): Array<{ name: string; value: string[] }> => {
      if (!specifics?.NameValueList) return [];
      const list = Array.isArray(specifics.NameValueList)
        ? specifics.NameValueList
        : [specifics.NameValueList];
      return list.map((nvl: any) => ({
        name: nvl.Name || '',
        value: Array.isArray(nvl.Value) ? nvl.Value : nvl.Value ? [nvl.Value] : [],
      }));
    };

    const parsePictures = (pictures: any): string[] => {
      if (!pictures?.PictureURL) return [];
      return Array.isArray(pictures.PictureURL)
        ? pictures.PictureURL
        : [pictures.PictureURL];
    };

    return {
      itemId: item.ItemID || null,
      title: item.Title || '',
      subtitle: item.SubTitle || null,
      description: item.Description || '',
      sku: item.SKU || null,
      listingType: item.ListingType || null,
      listingDuration: item.ListingDuration || null,
      startTime: parseDate(item.ListingDetails?.StartTime),
      endTime: parseDate(item.ListingDetails?.EndTime),
      viewCount: parseNumber(item.ListingDetails?.HitCount),
      watchCount: parseNumber(item.WatchCount),
      quantity: parseNumber(item.Quantity),
      quantitySold: parseNumber(item.SellingStatus?.QuantitySold),
      quantityAvailable: parseNumber(item.QuantityAvailable),
      startPrice: parsePrice(item.StartPrice),
      currentPrice: parsePrice(item.SellingStatus?.CurrentPrice),
      buyItNowPrice: parsePrice(item.BuyItNowPrice),
      reservePrice: parsePrice(item.ReservePrice),
      reserveMet: item.SellingStatus?.ReserveMet === 'true',
      bidCount: parseNumber(item.SellingStatus?.BidCount),
      status: item.SellingStatus?.ListingStatus || null,
      conditionId: item.ConditionID || null,
      conditionDisplayName: item.ConditionDisplayName || null,
      primaryCategory: {
        id: item.PrimaryCategory?.CategoryID || null,
        name: item.PrimaryCategory?.CategoryName || null,
      },
      itemSpecifics: parseSpecifics(item.ItemSpecifics),
      pictures: parsePictures(item.PictureDetails),
      location: item.Location || null,
      country: item.Country || null,
      seller: {
        userId: item.Seller?.UserID || null,
        feedbackScore: parseNumber(item.Seller?.FeedbackScore),
        positiveFeedbackPercent: parseNumber(item.Seller?.PositiveFeedbackPercent),
      },
      shippingDetails: item.ShippingDetails || null,
      returnPolicy: item.ReturnPolicy || null,
      paymentMethods: item.PaymentMethods || null,
      bestOfferEnabled: item.BestOfferDetails?.BestOfferEnabled === 'true',
      privateListing: item.PrivateListing === 'true',
    };
  }

  static parseOrderData(order: any): any {
    if (!order) return null;

    const parsePrice = (val: any): number => {
      if (!val) return 0;
      if (typeof val === 'object' && val._ !== undefined) return parseFloat(val._) || 0;
      return parseFloat(val) || 0;
    };

    const parseDate = (val: any): string | null => {
      if (!val) return null;
      if (typeof val === 'object' && val._ !== undefined) return val._;
      return String(val);
    };

    const parseLineItems = (lineItems: any): any[] => {
      if (!lineItems) return [];
      const items = Array.isArray(lineItems) ? lineItems : [lineItems];
      return items.map((li: any) => ({
        lineItemId: li.Transaction?.TransactionID || li.LineItemID || null,
        itemId: li.Item?.ItemID || null,
        title: li.Item?.Title || '',
        sku: li.Item?.SKU || null,
        quantity: parseInt(li.QuantityPurchased || '0'),
        price: parsePrice(li.Transaction?.BuyerPaidItemPrice),
        status: li.Transaction?.Status?.CheckoutStatus || null,
      }));
    };

    return {
      orderId: order.OrderID || order.OrderArray?.Order?.OrderID || null,
      orderStatus: order.OrderStatus || null,
      paymentStatus: order.CheckoutStatus?.Status || null,
      shippingStatus: order.OrderFulfillmentStatus || null,
      buyer: {
        userId: order.BuyerUserID || null,
        name: order.ShippingAddress?.Name || null,
        email: order.BuyerEmail || null,
      },
      shippingAddress: order.ShippingAddress ? {
        name: order.ShippingAddress.Name || null,
        street1: order.ShippingAddress.Street1 || null,
        street2: order.ShippingAddress.Street2 || null,
        city: order.ShippingAddress.CityName || null,
        state: order.ShippingAddress.StateOrProvince || null,
        postalCode: order.ShippingAddress.PostalCode || null,
        country: order.ShippingAddress.CountryName || null,
        phone: order.ShippingAddress.Phone || null,
      } : null,
      total: parsePrice(order.Total),
      subtotal: parsePrice(order.Subtotal),
      shippingCost: parsePrice(order.ShippingDetails?.ShippingServiceOptions?.ShippingServiceCost),
      tax: parsePrice(order.TotalTax),
      currency: typeof order.Total === 'object' && order.Total.$ ? order.Total.$.currencyID : 'GBP',
      lineItems: parseLineItems(order.TransactionArray?.Transaction),
      createdDate: parseDate(order.CreatedTime),
      paidDate: parseDate(order.PaidTime),
      shippedDate: parseDate(order.ShippedTime),
      estimatedDelivery: parseDate(order.EstimatedDeliveryDate),
      shippingService: order.ShippingDetails?.ShippingServiceUsed || null,
      trackingNumber: order.ShippingDetails?.ShipmentTrackingDetails?.ShipmentTrackingNumber || null,
      sellerNotes: order.SellerEmails?.NoteText || null,
    };
  }
}
