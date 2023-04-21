import 'express-session';

declare module 'express-session' {
    interface SessionData {
        oauth: {
            inviteCode?: string | undefined;
            returnTo?: string | undefined;
        };
    }
}
