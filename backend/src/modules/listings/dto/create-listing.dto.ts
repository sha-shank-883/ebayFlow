export enum ListingStatus {
  ACTIVE = 'ACTIVE',
  ENDED = 'ENDED',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
}

export class CreateListingDto {
  ebayAccountId: string;
  title: string;
  description?: string;
  price: number;
  quantity: number;
  sku?: string;
  images?: string[];
  itemSpecifics?: Record<string, string>;
  status?: ListingStatus;
}
