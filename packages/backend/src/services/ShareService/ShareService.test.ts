import { ForbiddenError } from '@lightdash/common';
import { shareModel } from '../../models/models';
import { ShareService } from './ShareService';
import {
    Config,
    FullShareUrl,
    FullShareUrlWithoutParams,
    SampleShareUrl,
    ShareUrlWithoutParams,
    User,
    UserFromAnotherOrg,
} from './ShareService.mock';

jest.mock('../../models/models', () => ({
    shareModel: {
        createSharedUrl: jest.fn(async () => SampleShareUrl),
        getSharedUrl: jest.fn(async () => SampleShareUrl),
    },
}));

describe('share', () => {
    const shareService = new ShareService({
        shareModel,
        lightdashConfig: Config,
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('Should save sharedUrl', async () => {
        expect(
            await shareService.createShareUrl(
                User,
                SampleShareUrl.path,
                SampleShareUrl.params,
            ),
        ).toEqual(FullShareUrl);
    });
    it('Should get saved sharedUrl', async () => {
        expect(
            await shareService.getShareUrl(User, SampleShareUrl.nanoid),
        ).toEqual(FullShareUrl);
    });

    it('Should get saved sharedUrl without params', async () => {
        (shareModel.getSharedUrl as jest.Mock).mockImplementationOnce(
            async () => ShareUrlWithoutParams,
        );

        expect(
            await shareService.getShareUrl(User, ShareUrlWithoutParams.nanoid),
        ).toEqual(FullShareUrlWithoutParams);
    });

    it('Should throw error if user does not have access to the organization', async () => {
        await expect(
            shareService.getShareUrl(UserFromAnotherOrg, SampleShareUrl.nanoid),
        ).rejects.toThrowError(ForbiddenError);
    });
});
