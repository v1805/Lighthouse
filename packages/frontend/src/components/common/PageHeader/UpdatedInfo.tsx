import { SessionUser } from '@lightdash/common';
import { FC } from 'react';
import { UpdatedInfoLabel } from '.';
import { useTimeAgo } from '../../../hooks/useTimeAgo';

export const UpdatedInfo: FC<{
    updatedAt: Date;
    user: Partial<SessionUser> | undefined;
}> = ({ updatedAt, user }) => {
    const timeAgo = useTimeAgo(updatedAt);

    return (
        <UpdatedInfoLabel>
            Last edited <b>{timeAgo}</b>{' '}
            {user && user.firstName ? (
                <>
                    by{' '}
                    <b>
                        {user.firstName} {user.lastName}
                    </b>
                </>
            ) : (
                ''
            )}
        </UpdatedInfoLabel>
    );
};
