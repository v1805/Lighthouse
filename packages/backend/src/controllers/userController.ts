import {
    ApiEmailStatusResponse,
    ApiErrorPayload,
    ApiSuccessEmpty,
    ApiUserAllowedOrganizationsResponse,
} from '@lightdash/common';
import { Controller, Delete, Query } from '@tsoa/runtime';
import express from 'express';
import {
    Get,
    Middlewares,
    OperationId,
    Path,
    Post,
    Put,
    Request,
    Response,
    Route,
} from 'tsoa';
import { userModel } from '../models/models';
import { userService } from '../services/services';
import {
    allowApiKeyAuthentication,
    isAuthenticated,
    unauthorisedInDemo,
} from './authentication';

@Route('/api/v1/user')
@Response<ApiErrorPayload>('default', 'Error')
export class UserController extends Controller {
    /**
     * Create a new one-time passcode for the current user's primary email
     * @param req express request
     */
    @Middlewares([isAuthenticated, unauthorisedInDemo])
    @Put('/me/email/otp')
    @OperationId('createEmailOneTimePasscode')
    async createEmailOneTimePasscode(
        @Request() req: express.Request,
    ): Promise<ApiEmailStatusResponse> {
        const status = await userService.sendOneTimePasscodeToPrimaryEmail(
            req.user!,
        );
        this.setStatus(200);
        return {
            status: 'ok',
            results: status,
        };
    }

    /**
     * Get the verification status for the current user's primary email
     * @param req express request
     * @param pascode the one-time passcode sent to the user's primary email
     */
    @Middlewares([isAuthenticated])
    @Get('/me/email/status')
    @OperationId('getEmailVerificationStatus')
    async getEmailVerificationStatus(
        @Request() req: express.Request,
        @Query() passcode?: string,
    ): Promise<ApiEmailStatusResponse> {
        // Throws 404 error if not found
        const status = await userService.getPrimaryEmailStatus(
            req.user!,
            passcode,
        );
        this.setStatus(200);
        return {
            status: 'ok',
            results: status,
        };
    }

    /**
     * Get list or organizations the user is allowed to join
     * @param req express request
     */
    @Middlewares([allowApiKeyAuthentication, isAuthenticated])
    @Get('/me/allowedOrganizations')
    @OperationId('getOrganizationsUserCanJoin')
    async getOrganizationsUserCanJoin(
        @Request() req: express.Request,
    ): Promise<ApiUserAllowedOrganizationsResponse> {
        const status = await userService.getAllowedOrganizations(req.user!);
        this.setStatus(200);
        return {
            status: 'ok',
            results: status,
        };
    }

    /**
     * Join an organization
     * @param req express request
     * @param organizationUuid the uuid of the organization to join
     */
    @Middlewares([
        allowApiKeyAuthentication,
        isAuthenticated,
        unauthorisedInDemo,
    ])
    @Post('/me/joinOrganization/{organizationUuid}')
    @OperationId('joinOrganization')
    async joinOrganization(
        @Request() req: express.Request,
        @Path() organizationUuid: string,
    ): Promise<ApiSuccessEmpty> {
        await userService.joinOrg(req.user!, organizationUuid);
        const sessionUser = await userModel.findSessionUserByUUID(
            req.user!.userUuid,
        );
        await new Promise<void>((resolve, reject) => {
            req.login(sessionUser, (err) => {
                if (err) {
                    reject(err);
                }
                resolve();
            });
        });
        this.setStatus(200);
        return {
            status: 'ok',
            results: undefined,
        };
    }

    /**
     * Delete user
     * @param req express request
     */
    @Middlewares([isAuthenticated])
    @Delete('/me')
    @OperationId('deleteUser')
    async deleteUser(
        @Request() req: express.Request,
    ): Promise<ApiSuccessEmpty> {
        await userService.delete(req.user!, req.user!.userUuid);
        this.setStatus(200);
        return {
            status: 'ok',
            results: undefined,
        };
    }
}
