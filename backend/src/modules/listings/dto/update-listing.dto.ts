// backend/src/modules/listings/dto/update-listing.dto.ts
import { CreateListingDto } from './create-listing.dto';

export class UpdateListingDto extends CreateListingDto {
  constructor(partial?: Partial<CreateListingDto>) {
    super();
    if (partial) {
      Object.assign(this, partial);
    }
  }
}

