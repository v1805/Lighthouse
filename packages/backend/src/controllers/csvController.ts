import { ApiCsvUrlResponse, ApiErrorPayload } from '@lightdash/common';
import { Get, Post } from '@tsoa/runtime';
import express from 'express';
import {
    Body,
    Controller,
    Middlewares,
    OperationId,
    Path,
    Request,
    Response,
    Route,
    SuccessResponse,
} from 'tsoa';
import { schedulerService } from '../services/services';
import { allowApiKeyAuthentication, isAuthenticated } from './authentication';

@Route('/api/v1/csv')
@Response<ApiErrorPayload>('default', 'Error')
export class CsvController extends Controller {
    /**
     * Get a Csv
     * @param jobId the jobId for the CSV
     * @param req express request
     */
    @Middlewares([allowApiKeyAuthentication, isAuthenticated])
    @SuccessResponse('200', 'Success')
    @Get('{jobId}')
    @OperationId('getCsvUrl')
    async get(
        @Path() jobId: string,
        @Request() req: express.Request,
    ): Promise<ApiCsvUrlResponse> {
        this.setStatus(200);
        const csvDetails = await schedulerService.getCsvUrl(req.user!, jobId);
        return {
            status: 'ok',
            results: {
                url: csvDetails.details?.fileUrl,
                status: csvDetails.status,
            },
        };
    }
}
