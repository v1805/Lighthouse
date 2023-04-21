import {
    NotFoundError,
    OrganizationMemberProfile,
    OrganizationMemberProfileUpdate,
    OrganizationMemberRole,
} from '@lightdash/common';
import { Knex } from 'knex';
import { EmailTableName } from '../database/entities/emails';
import { InviteLinkTableName } from '../database/entities/inviteLinks';
import {
    DbOrganizationMembership,
    DbOrganizationMembershipIn,
    OrganizationMembershipsTableName,
} from '../database/entities/organizationMemberships';
import {
    DbOrganization,
    OrganizationTableName,
} from '../database/entities/organizations';
import { DbUser, UserTableName } from '../database/entities/users';

type DbOrganizationMemberProfile = {
    user_uuid: string;
    first_name: string;
    last_name: string;
    is_active: boolean;
    email: string;
    organization_uuid: string;
    role: OrganizationMemberRole;
    expires_at?: Date;
};

const SelectColumns = [
    `${UserTableName}.user_uuid`,
    `${UserTableName}.first_name`,
    `${UserTableName}.last_name`,
    `${UserTableName}.is_active`,
    `${EmailTableName}.email`,
    `${OrganizationTableName}.organization_uuid`,
    `${OrganizationMembershipsTableName}.role`,
    `${InviteLinkTableName}.expires_at`,
];

export class OrganizationMemberProfileModel {
    private readonly database: Knex;

    private readonly queryBuilder: () => Knex.QueryBuilder<
        DbOrganizationMemberProfile[]
    >;

    constructor({ database }: { database: Knex }) {
        this.database = database;
        this.queryBuilder = () =>
            database(OrganizationMembershipsTableName)
                .innerJoin(
                    UserTableName,
                    `${OrganizationMembershipsTableName}.user_id`,
                    `${UserTableName}.user_id`,
                )
                .joinRaw(
                    `INNER JOIN ${EmailTableName} ON ${UserTableName}.user_id = ${EmailTableName}.user_id AND ${EmailTableName}.is_primary`,
                )
                .innerJoin(
                    OrganizationTableName,
                    `${OrganizationMembershipsTableName}.organization_id`,
                    `${OrganizationTableName}.organization_id`,
                )
                .leftJoin(
                    InviteLinkTableName,
                    `${UserTableName}.user_uuid`,
                    `${InviteLinkTableName}.user_uuid`,
                );
    }

    private static parseRow(
        member: DbOrganizationMemberProfile,
    ): OrganizationMemberProfile {
        return {
            userUuid: member.user_uuid,
            firstName: member.first_name,
            lastName: member.last_name,
            email: member.email,
            organizationUuid: member.organization_uuid,
            role: member.role,
            isActive: member.is_active,
            isInviteExpired:
                !member.is_active &&
                (!member.expires_at || member.expires_at < new Date()),
        };
    }

    async findOrganizationMember(
        organizationUuid: string,
        userUuid: string,
    ): Promise<OrganizationMemberProfile | undefined> {
        const [member] = await this.queryBuilder()
            .where(`${UserTableName}.user_uuid`, userUuid)
            .andWhere(
                `${OrganizationTableName}.organization_uuid`,
                organizationUuid,
            )
            .select<DbOrganizationMemberProfile[]>(SelectColumns);

        return member && OrganizationMemberProfileModel.parseRow(member);
    }

    async getOrganizationMembers(
        organizationUuid: string,
    ): Promise<OrganizationMemberProfile[]> {
        const members = await this.queryBuilder()
            .where(
                `${OrganizationTableName}.organization_uuid`,
                organizationUuid,
            )
            .select<DbOrganizationMemberProfile[]>(SelectColumns);
        return members.map(OrganizationMemberProfileModel.parseRow);
    }

    async getOrganizationAdmins(
        organizationUuid: string,
    ): Promise<OrganizationMemberProfile[]> {
        const members = await this.queryBuilder()
            .where(
                `${OrganizationTableName}.organization_uuid`,
                organizationUuid,
            )
            .andWhere('role', 'admin')
            .select<DbOrganizationMemberProfile[]>(SelectColumns);
        return members.map(OrganizationMemberProfileModel.parseRow);
    }

    createOrganizationMembership = async (
        membershipIn: DbOrganizationMembershipIn,
    ) => {
        await this.database<DbOrganizationMembership>(
            'organization_memberships',
        ).insert<DbOrganizationMembershipIn>(membershipIn);
    };

    async getOrganizationMember(organizationUuid: string, userUuid: string) {
        const member = await this.findOrganizationMember(
            organizationUuid,
            userUuid,
        );
        if (member) {
            return member;
        }
        throw new NotFoundError('No matching member found in organization');
    }

    async updateOrganizationMember(
        organizationUuid: string,
        userUuid: string,
        data: OrganizationMemberProfileUpdate,
    ): Promise<OrganizationMemberProfile> {
        if (data.role) {
            const sqlParams = {
                organizationUuid,
                userUuid,
                role: data.role,
            };
            await this.database.raw<
                (DbOrganizationMemberProfile & DbOrganization & DbUser)[]
            >(
                `
                    UPDATE organization_memberships AS m
                    SET role = :role FROM organizations AS o, users AS u
                    WHERE o.organization_id = m.organization_id
                      AND u.user_id = m.user_id
                      AND user_uuid = :userUuid
                      AND organization_uuid = :organizationUuid
                        RETURNING *
                `,
                sqlParams,
            );
        }
        return this.getOrganizationMember(organizationUuid, userUuid);
    }
}
