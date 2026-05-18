// c:\Users\User\Desktop\seller\sellerflow-ai\backend\src\modules\billing\billing.controller.ts
import { Controller, Get, Post, Body, UseGuards, Headers, Req, RawBodyRequest } from '@nestjs/common';
import { BillingService } from './billing.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';

@ApiTags('billing')
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  private getWorkspaceId(user: any): string {
    return user.workspaces[0]?.workspaceId;
  }

  @Post('create-checkout-session')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a Stripe checkout session' })
  createCheckoutSession(@CurrentUser() user: any, @Body() dto: CreateSubscriptionDto) {
    const workspaceId = this.getWorkspaceId(user);
    return this.billingService.createCheckoutSession(workspaceId, dto.priceId);
  }

  @Get('status')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current subscription status' })
  getStatus(@CurrentUser() user: any) {
    const workspaceId = this.getWorkspaceId(user);
    return this.billingService.getSubscriptionStatus(workspaceId);
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Handle Stripe webhooks' })
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    // Note: requires raw body enabled in main.ts
    const payload = req.rawBody;
    return this.billingService.handleWebhook(signature, payload);
  }
}
