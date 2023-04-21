import {
    getRequestMethod,
    LightdashRequestMethodHeader,
} from '@lightdash/common';
import express from 'express';
import {
    allowApiKeyAuthentication,
    isAuthenticated,
    unauthorisedInDemo,
} from '../controllers/authentication';
import { userModel } from '../models/models';
import { UserModel } from '../models/UserModel';
import { personalAccessTokenService, userService } from '../services/services';
import { sanitizeStringParam } from '../utils';

export const userRouter = express.Router();

userRouter.get('/', allowApiKeyAuthentication, isAuthenticated, (req, res) => {
    res.json({
        status: 'ok',
        results: UserModel.lightdashUserFromSession(req.user!),
    });
});

userRouter.post('/', unauthorisedInDemo, async (req, res, next) => {
    try {
        const lightdashUser = await userService.activateUserFromInvite(
            req.body.inviteCode,
            {
                firstName: sanitizeStringParam(req.body.firstName),
                lastName: sanitizeStringParam(req.body.lastName),
                password: sanitizeStringParam(req.body.password),
            },
        );
        const sessionUser = await userModel.findSessionUserByUUID(
            lightdashUser.userUuid,
        );
        req.login(sessionUser, (err) => {
            if (err) {
                next(err);
            }
            res.json({
                status: 'ok',
                results: lightdashUser,
            });
        });
    } catch (e) {
        next(e);
    }
});

userRouter.patch(
    '/me',
    isAuthenticated,
    unauthorisedInDemo,
    async (req, res, next) => {
        userService
            .updateUser(req.user!, req.body)
            .then((user) => {
                res.json({
                    status: 'ok',
                    results: user,
                });
            })
            .catch(next);
    },
);

userRouter.get('/password', isAuthenticated, async (req, res, next) =>
    userService
        .hasPassword(req.user!)
        .then((hasPassword: boolean) => {
            res.json({
                status: 'ok',
                results: hasPassword,
            });
        })
        .catch(next),
);

userRouter.post(
    '/password',
    isAuthenticated,
    unauthorisedInDemo,
    async (req, res, next) =>
        userService
            .updatePassword(req.user!, req.body)
            .then(() => {
                req.logout((err) => {
                    if (err) {
                        return next(err);
                    }
                    return req.session.save((err2) => {
                        if (err2) {
                            next(err2);
                        } else {
                            res.json({
                                status: 'ok',
                            });
                        }
                    });
                });
            })
            .catch(next),
);

userRouter.post('/password/reset', unauthorisedInDemo, async (req, res, next) =>
    userService
        .resetPassword(req.body)
        .then(() => {
            res.json({
                status: 'ok',
            });
        })
        .catch(next),
);

userRouter.get('/identities', isAuthenticated, async (req, res, next) => {
    const identities = await userService.getLinkedIdentities(req.user!);
    res.json({
        status: 'ok',
        results: identities,
    });
});

userRouter.delete(
    '/identity',
    isAuthenticated,
    unauthorisedInDemo,
    async (req, res, next) => {
        userService
            .deleteLinkedIdentity(req.user!, req.body)
            .then(() => {
                res.json({
                    status: 'ok',
                });
            })
            .catch(next);
    },
);

userRouter.patch(
    '/me/complete',
    isAuthenticated,
    unauthorisedInDemo,
    async (req, res, next) => {
        userService
            .completeUserSetup(req.user!, req.body)
            .then((results) => {
                res.json({
                    status: 'ok',
                    results,
                });
            })
            .catch(next);
    },
);

userRouter.post(
    '/me/personal-access-tokens',
    isAuthenticated,
    unauthorisedInDemo,
    async (req, res, next) => {
        personalAccessTokenService
            .createPersonalAccessToken(
                req.user!,
                req.body,
                getRequestMethod(req.header(LightdashRequestMethodHeader)),
            )
            .then((results) => res.json({ status: 'ok', results }))
            .catch(next);
    },
);

userRouter.get(
    '/me/personal-access-tokens',
    isAuthenticated,
    unauthorisedInDemo,
    async (req, res, next) => {
        personalAccessTokenService
            .getAllPersonalAccessTokens(req.user!)
            .then((results) =>
                res.json({
                    status: 'ok',
                    results,
                }),
            )
            .catch(next);
    },
);

userRouter.delete(
    '/me/personal-access-tokens/:tokenUuid',
    isAuthenticated,
    unauthorisedInDemo,
    async (req, res, next) => {
        personalAccessTokenService
            .deletePersonalAccessToken(req.user!, req.params.tokenUuid)
            .then(() =>
                res.json({
                    status: 'ok',
                }),
            )
            .catch(next);
    },
);
