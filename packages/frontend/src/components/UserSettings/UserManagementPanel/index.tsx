import {
    Button,
    ButtonGroup,
    Classes,
    Colors,
    Dialog,
    Icon,
    NonIdealState,
    Spinner,
} from '@blueprintjs/core';
import {
    OrganizationMemberProfile,
    OrganizationMemberRole,
} from '@lightdash/common';
import { FC, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useCreateInviteLinkMutation } from '../../../hooks/useInviteLink';
import {
    useDeleteOrganizationUserMutation,
    useOrganizationUsers,
    useUpdateUserMutation,
} from '../../../hooks/useOrganizationUsers';
import { useApp } from '../../../providers/AppProvider';
import { TrackPage, useTracking } from '../../../providers/TrackingProvider';
import {
    CategoryName,
    EventName,
    PageName,
    PageType,
} from '../../../types/Events';
import InvitesPanel from '../InvitesPanel';
import InviteSuccess from './InviteSuccess';
import {
    AddUserButton,
    HeaderWrapper,
    ItemContent,
    NewLinkButton,
    PanelTitle,
    PendingEmail,
    PendingTag,
    RoleSelectButton,
    SectionWrapper,
    TitleWrapper,
    UserEmail,
    UserInfo,
    UserListItemWrapper,
    UserManagementPanelWrapper,
    UserName,
} from './UserManagementPanel.styles';

const UserListItem: FC<{
    disabled: boolean;
    user: OrganizationMemberProfile;
}> = ({
    disabled,
    user: {
        userUuid,
        firstName,
        lastName,
        email,
        role,
        isActive,
        isInviteExpired,
    },
}) => {
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const { mutate, isLoading: isDeleting } =
        useDeleteOrganizationUserMutation();
    const inviteLink = useCreateInviteLinkMutation();
    const { track } = useTracking();
    const { user, health } = useApp();
    const updateUser = useUpdateUserMutation(userUuid);
    const handleDelete = () => mutate(userUuid);

    const getNewLink = () => {
        track({
            name: EventName.INVITE_BUTTON_CLICKED,
        });
        inviteLink.mutate({ email, role });
    };

    return (
        <UserListItemWrapper elevation={0}>
            <ItemContent>
                <SectionWrapper>
                    {isActive ? (
                        <UserInfo>
                            <UserName
                                className={Classes.TEXT_OVERFLOW_ELLIPSIS}
                            >
                                {firstName} {lastName}
                            </UserName>
                            {email && <UserEmail minimal>{email}</UserEmail>}
                        </UserInfo>
                    ) : (
                        <UserInfo>
                            {email && <PendingEmail>{email}</PendingEmail>}
                            <div>
                                <PendingTag intent="warning">
                                    {!isInviteExpired
                                        ? 'Pending'
                                        : 'Link expired'}
                                </PendingTag>
                                {user.data?.ability?.can(
                                    'create',
                                    'InviteLink',
                                ) && (
                                    <NewLinkButton onClick={getNewLink}>
                                        {health.data?.hasEmailClient
                                            ? 'Send new invite'
                                            : 'Get new link'}
                                    </NewLinkButton>
                                )}
                            </div>
                        </UserInfo>
                    )}
                    {user.data?.ability?.can(
                        'manage',
                        'OrganizationMemberProfile',
                    ) && (
                        <ButtonGroup>
                            <RoleSelectButton
                                fill
                                id="user-role"
                                options={Object.values(
                                    OrganizationMemberRole,
                                ).map((orgMemberRole) => ({
                                    value: orgMemberRole,
                                    label: orgMemberRole.replace('_', ' '),
                                }))}
                                required
                                onChange={(e) => {
                                    updateUser.mutate({
                                        role: e.currentTarget
                                            .value as OrganizationMemberRole,
                                    });
                                }}
                                value={role}
                            />

                            <Button
                                icon="delete"
                                intent="danger"
                                outlined
                                onClick={() => setIsDeleteDialogOpen(true)}
                                text="Delete"
                                disabled={disabled}
                            />
                        </ButtonGroup>
                    )}
                </SectionWrapper>
                {inviteLink.data && <InviteSuccess invite={inviteLink.data} />}
            </ItemContent>
            <Dialog
                isOpen={isDeleteDialogOpen}
                icon="person"
                onClose={() =>
                    !isDeleting ? setIsDeleteDialogOpen(false) : undefined
                }
                title="Delete user"
                lazy
            >
                <div className={Classes.DIALOG_BODY}>
                    <p>Are you sure you want to delete this user ?</p>
                </div>
                <div className={Classes.DIALOG_FOOTER}>
                    <div className={Classes.DIALOG_FOOTER_ACTIONS}>
                        <Button
                            disabled={isDeleting}
                            onClick={() => setIsDeleteDialogOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            disabled={isDeleting}
                            intent="danger"
                            onClick={handleDelete}
                        >
                            Delete
                        </Button>
                    </div>
                </div>
            </Dialog>
        </UserListItemWrapper>
    );
};

const UserManagementPanel: FC = () => {
    const { user } = useApp();
    const [showInvitePage, setShowInvitePage] = useState(false);
    const { data: organizationUsers, isLoading } = useOrganizationUsers();
    const { search } = useLocation();

    useEffect(() => {
        const searchParams = new URLSearchParams(search);
        const toParam = searchParams.get('to');
        if (toParam === 'invite') {
            setShowInvitePage(true);
        }
    }, [search]);

    if (showInvitePage) {
        return (
            <TrackPage
                name={PageName.INVITE_MANAGEMENT_SETTINGS}
                type={PageType.MODAL}
                category={CategoryName.SETTINGS}
            >
                <InvitesPanel onBackClick={() => setShowInvitePage(false)} />
            </TrackPage>
        );
    }

    return (
        <UserManagementPanelWrapper>
            {user.data?.ability?.can('create', 'InviteLink') && (
                <HeaderWrapper>
                    <TitleWrapper>
                        <PanelTitle>User management settings</PanelTitle>
                        <a
                            role="button"
                            href="https://docs.lightdash.com/references/roles"
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: Colors.GRAY5 }}
                        >
                            <Icon icon="info-sign" />
                        </a>
                    </TitleWrapper>
                    <AddUserButton
                        intent="primary"
                        onClick={() => setShowInvitePage(true)}
                        text="Add user"
                    />
                </HeaderWrapper>
            )}
            {isLoading ? (
                <NonIdealState title="Loading users" icon={<Spinner />} />
            ) : (
                organizationUsers?.map((orgUser) => (
                    <UserListItem
                        key={orgUser.email}
                        user={orgUser}
                        disabled={
                            user.data?.userUuid === orgUser.userUuid ||
                            organizationUsers.length <= 1
                        }
                    />
                ))
            )}
        </UserManagementPanelWrapper>
    );
};

export default UserManagementPanel;
