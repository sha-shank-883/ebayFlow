// c:\Users\User\Desktop\seller\sellerflow-ai\backend\src\modules\ebay\ebay.controller.ts
import { Controller, Get, Post, Delete, Query, Param, UseGuards, Res, BadRequestException, Body } from '@nestjs/common';
import { EbayService } from './ebay.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';

@ApiTags('ebay')
@Controller('ebay')
export class EbayController {
  constructor(
    private readonly ebayService: EbayService,
    private readonly configService: ConfigService,
  ) {}

  private getWorkspaceId(user: any): string {
    return user.workspaces[0]?.workspaceId;
  }

  @Get('auth-url')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get eBay OAuth URL' })
  async getAuthUrl(@CurrentUser() user: any) {
    const workspaceId = this.getWorkspaceId(user);
    if (!workspaceId) {
      throw new BadRequestException('User has no active workspace');
    }
    return this.ebayService.generateAuthUrl(workspaceId);
  }

  @Get('callback')
  @ApiOperation({ summary: 'Handle eBay OAuth callback' })
  async handleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    try {
      await this.ebayService.handleCallback(code, state);
      const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/settings?success=true`);
    } catch (error: any) {
      console.error('[eBay Callback] Error:', error);
      const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/settings?error=ebay_auth_failed`);
    }
  }

  @Get('accounts')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get connected eBay accounts' })
  getConnectedAccounts(@CurrentUser() user: any) {
    const workspaceId = this.getWorkspaceId(user);
    return this.ebayService.getConnectedAccounts(workspaceId);
  }

  @Post('accounts/:accountId/sync')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Trigger sync for an eBay account' })
  syncListings(@CurrentUser() user: any, @Param('accountId') accountId: string) {
    const workspaceId = this.getWorkspaceId(user);
    return this.ebayService.syncListings(workspaceId, accountId);
  }

  @Get('accounts/:accountId/listings')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get listings for an eBay account' })
  getListings(
    @CurrentUser() user: any,
    @Param('accountId') accountId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const workspaceId = this.getWorkspaceId(user);
    return this.ebayService.getListings(
      workspaceId,
      accountId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Post('accounts/:accountId/sync-orders')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Sync orders for an eBay account' })
  syncOrders(@CurrentUser() user: any, @Param('accountId') accountId: string) {
    const workspaceId = this.getWorkspaceId(user);
    return this.ebayService.syncOrders(workspaceId, accountId);
  }

  @Get('accounts/:accountId/orders')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get orders for an eBay account' })
  getOrders(
    @CurrentUser() user: any,
    @Param('accountId') accountId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const workspaceId = this.getWorkspaceId(user);
    return this.ebayService.getOrders(
      workspaceId,
      accountId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Post('accounts/:accountId/listings')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a new eBay listing' })
  createListing(
    @CurrentUser() user: any, 
    @Param('accountId') accountId: string,
    @Body() listingData: any
  ) {
    const workspaceId = this.getWorkspaceId(user);
    return this.ebayService.createListing(workspaceId, accountId, listingData);
  }

  @Delete('accounts/:accountId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Remove a connected eBay account' })
  removeAccount(@CurrentUser() user: any, @Param('accountId') accountId: string) {
    const workspaceId = this.getWorkspaceId(user);
    return this.ebayService.removeAccount(workspaceId, accountId);
  }
}
