// c:\Users\User\Desktop\seller\sellerflow-ai\backend\src\modules\listings\listings.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ListingsService } from './listings.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('listings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('listings')
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  // Helper to extract default workspace
  private getWorkspaceId(user: any): string {
    // In a real app, this might come from a custom header or query param
    // For now, we take the first workspace of the user
    return user.workspaces[0]?.workspaceId;
  }

  @Post()
  @ApiOperation({ summary: 'Create a new listing' })
  create(@CurrentUser() user: any, @Body() createListingDto: CreateListingDto) {
    const workspaceId = this.getWorkspaceId(user);
    return this.listingsService.create(workspaceId, createListingDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all listings for workspace' })
  findAll(
    @CurrentUser() user: any,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('search') search?: string,
  ) {
    const workspaceId = this.getWorkspaceId(user);
    return this.listingsService.findAll(
      workspaceId,
      skip ? parseInt(skip) : 0,
      take ? parseInt(take) : 50,
      search,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific listing' })
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    const workspaceId = this.getWorkspaceId(user);
    return this.listingsService.findOne(id, workspaceId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a listing' })
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() updateListingDto: UpdateListingDto) {
    const workspaceId = this.getWorkspaceId(user);
    return this.listingsService.update(id, workspaceId, updateListingDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a listing' })
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    const workspaceId = this.getWorkspaceId(user);
    return this.listingsService.remove(id, workspaceId);
  }

  @Post(':id/generate-description')
  @ApiOperation({ summary: 'Generate AI description for a listing' })
  generateDescription(@CurrentUser() user: any, @Param('id') id: string) {
    const workspaceId = this.getWorkspaceId(user);
    return this.listingsService.generateDescription(id, workspaceId);
  }

  @Post(':id/publish')
  @ApiOperation({ summary: 'Publish listing to eBay' })
  publishToEbay(@CurrentUser() user: any, @Param('id') id: string) {
    const workspaceId = this.getWorkspaceId(user);
    return this.listingsService.publishToEbay(id, workspaceId);
  }
}
