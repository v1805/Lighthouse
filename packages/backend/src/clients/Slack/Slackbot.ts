import { LightdashMode } from '@lightdash/common';
import * as Sentry from '@sentry/node';
import { App, ExpressReceiver, LogLevel } from '@slack/bolt';
import { nanoid } from 'nanoid';
import { analytics } from '../../analytics/client';
import { LightdashConfig } from '../../config/parseConfig';
import Logger from '../../logger';
import { SlackAuthenticationModel } from '../../models/SlackAuthenticationModel';
import { apiV1Router } from '../../routers/apiV1Router';
import { unfurlService } from '../../services/services';
import { Unfurl } from '../../services/UnfurlService/UnfurlService';
import { getUnfurlBlocks } from './SlackMessageBlocks';
import { slackOptions } from './SlackOptions';

const notifySlackError = async (
    error: unknown,
    url: string,
    client: any,
    event: any,
): Promise<void> => {
    /** Expected slack errors:
     * - cannot_parse_attachment: Means the image on the blocks is not accessible from slack, is the URL public ?
     */
    Logger.error(`Unable to unfurl slack URL ${url}: ${error} `);

    // Send message in thread
    await client.chat
        .postMessage({
            thread_ts: event.message_ts,
            channel: event.channel,
            text: `:fire: Unable to unfurl ${url}: ${error}`,
        })
        .catch((er: any) =>
            Logger.error(`Unable send slack error message: ${er} `),
        );
};

type SlackServiceDependencies = {
    slackAuthenticationModel: SlackAuthenticationModel;
    lightdashConfig: LightdashConfig;
};

export class SlackService {
    slackAuthenticationModel: SlackAuthenticationModel;

    lightdashConfig: LightdashConfig;

    constructor({
        slackAuthenticationModel,
        lightdashConfig,
    }: SlackServiceDependencies) {
        this.lightdashConfig = lightdashConfig;
        this.slackAuthenticationModel = slackAuthenticationModel;
        this.start();
    }

    async start() {
        if (this.lightdashConfig.slack?.appToken) {
            try {
                const slackReceiver = new ExpressReceiver({
                    ...slackOptions,
                    installationStore: {
                        storeInstallation: (i) =>
                            this.slackAuthenticationModel.createInstallation(i),
                        fetchInstallation: (i) =>
                            this.slackAuthenticationModel.getInstallation(i),
                        deleteInstallation: (i) =>
                            this.slackAuthenticationModel.deleteInstallation(i),
                    },
                    router: apiV1Router,
                });

                await slackReceiver.start(parseInt('4352', 10));

                const app = new App({
                    ...slackOptions,
                    installationStore: {
                        storeInstallation: (i) =>
                            this.slackAuthenticationModel.createInstallation(i),
                        fetchInstallation: (i) =>
                            this.slackAuthenticationModel.getInstallation(i),
                    },
                    logLevel: LogLevel.INFO,
                    port: this.lightdashConfig.slack.port,
                    socketMode: true,
                    appToken: this.lightdashConfig.slack.appToken,
                });

                app.event('link_shared', (m) => this.unfurlSlackUrls(m));

                await app.start();
            } catch (e: unknown) {
                Logger.error(`Unable to start Slack app ${e}`);
            }
        } else {
            Logger.warn(`Missing "SLACK_APP_TOKEN", Slack App will not run`);
        }
    }

    private static async sendUnfurl(
        event: any,
        originalUrl: string,
        unfurl: Unfurl,
        client: any,
    ) {
        const unfurlBlocks = getUnfurlBlocks(originalUrl, unfurl);
        await client.chat
            .unfurl({
                ts: event.message_ts,
                channel: event.channel,
                unfurls: unfurlBlocks,
            })
            .catch((e: any) => {
                analytics.track({
                    event: 'share_slack.unfurl_error',
                    userId: event.user,
                    properties: {
                        error: `${e}`,
                    },
                });
                Logger.error(
                    `Unable to unfurl on slack ${JSON.stringify(
                        unfurlBlocks,
                    )}: ${JSON.stringify(e)}`,
                );
            });
    }

    async unfurlSlackUrls(message: any) {
        const { event, client, context } = message;

        if (event.channel === 'COMPOSER') return; // Do not unfurl urls when typing, only when message is sent

        Logger.debug(`Got link_shared slack event ${event.message_ts}`);

        event.links.map(async (l: any) => {
            const eventUserId = context.botUserId;

            try {
                const { teamId } = context;

                analytics.track({
                    event: 'share_slack.unfurl',
                    userId: eventUserId,
                    properties: {},
                });

                const details = await unfurlService.unfurlDetails(l.url);

                if (details) {
                    Logger.debug(
                        `Unfurling ${details.pageType} with URL ${details.minimalUrl}`,
                    );

                    await SlackService.sendUnfurl(
                        event,
                        l.url,
                        details,
                        client,
                    );

                    const imageId = `slack-image-${nanoid()}`;
                    const authUserUuid =
                        await this.slackAuthenticationModel.getUserUuid(teamId);

                    const imageUrl = await unfurlService.unfurlImage(
                        details.minimalUrl,
                        details.pageType,
                        imageId,
                        authUserUuid,
                    );

                    if (imageUrl) {
                        await SlackService.sendUnfurl(
                            event,
                            l.url,
                            { ...details, imageUrl },
                            client,
                        );

                        analytics.track({
                            event: 'share_slack.unfurl_completed',
                            userId: eventUserId,
                            properties: { pageType: details.pageType },
                        });
                    }
                }
            } catch (e) {
                if (this.lightdashConfig.mode === LightdashMode.PR)
                    notifySlackError(e, l.url, client, event);

                Sentry.captureException(e);

                analytics.track({
                    event: 'share_slack.unfurl_error',
                    userId: eventUserId,

                    properties: {
                        error: `${e}`,
                    },
                });
            }
        });
    }
}
