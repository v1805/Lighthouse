import {
    CartesianSeriesType,
    ChartType,
    ConditionalOperator,
    SEED_ORG_1_ADMIN,
    SEED_PROJECT,
} from '@lightdash/common';
import { Knex } from 'knex';
import { savedChartModel } from '../../../models/models';

export async function seed(knex: Knex): Promise<void> {
    // Deletes ALL existing entries
    await knex('saved_queries').del();

    const updatedByUser = {
        userUuid: SEED_ORG_1_ADMIN.user_uuid,
        firstName: SEED_ORG_1_ADMIN.first_name,
        lastName: SEED_ORG_1_ADMIN.last_name,
    };

    // Inserts seed entries
    await savedChartModel.create(
        SEED_PROJECT.project_uuid,
        SEED_ORG_1_ADMIN.user_uuid,
        {
            name: 'How much revenue do we have per payment method?',
            description:
                'Total revenue received via coupons, gift cards, bank transfers, and credit cards',
            tableName: 'payments',
            metricQuery: {
                dimensions: ['payments_payment_method'],
                metrics: [
                    'payments_total_revenue',
                    'payments_unique_payment_count',
                ],
                filters: {},
                sorts: [
                    {
                        fieldId: 'payments_total_revenue',
                        descending: false,
                    },
                ],
                limit: 10,
                tableCalculations: [],
            },
            chartConfig: {
                type: ChartType.CARTESIAN,
                config: {
                    layout: {
                        flipAxes: true,
                        xField: 'payments_payment_method',
                        yField: [
                            'payments_total_revenue',
                            'payments_unique_payment_count',
                        ],
                    },
                    eChartsConfig: {
                        series: [
                            {
                                encode: {
                                    xRef: { field: 'payments_payment_method' },
                                    yRef: { field: 'payments_total_revenue' },
                                },
                                type: CartesianSeriesType.BAR,
                            },
                            {
                                encode: {
                                    xRef: { field: 'payments_payment_method' },
                                    yRef: {
                                        field: 'payments_unique_payment_count',
                                    },
                                },
                                type: CartesianSeriesType.BAR,
                            },
                        ],
                    },
                },
            },
            tableConfig: {
                columnOrder: [
                    'payments_payment_method',
                    'payments_total_revenue',
                    'payments_unique_payment_count',
                ],
            },
            updatedByUser,
        },
    );

    await savedChartModel.create(
        SEED_PROJECT.project_uuid,
        SEED_ORG_1_ADMIN.user_uuid,
        {
            name: `What's our total revenue to date?`,
            description: `A single number showing the sum of all historical revenue`,
            tableName: 'payments',
            metricQuery: {
                dimensions: ['orders_status'],
                metrics: ['payments_total_revenue'],
                filters: {},
                limit: 500,
                sorts: [
                    {
                        fieldId: 'payments_total_revenue',
                        descending: true,
                    },
                ],
                tableCalculations: [
                    {
                        name: 'total_revenue',
                        displayName: 'total revenue',
                        sql: 'SUM(${payments.total_revenue}) OVER(PARTITION BY NULL)',
                    },
                ],
            },
            chartConfig: {
                type: ChartType.BIG_NUMBER,
                config: {
                    label: 'Payments total revenue',
                },
            },
            tableConfig: {
                columnOrder: [
                    'orders_status',
                    'payments_total_revenue',
                    'total_revenue',
                ],
            },
            updatedByUser,
        },
    );

    await savedChartModel.create(
        SEED_PROJECT.project_uuid,
        SEED_ORG_1_ADMIN.user_uuid,
        {
            name: 'How many orders we have over time ?',
            description:
                'Time series of orders received per day and total orders over time',
            tableName: 'orders',
            metricQuery: {
                dimensions: ['orders_order_date'],
                metrics: ['orders_unique_order_count'],
                filters: {},
                limit: 500,
                sorts: [
                    {
                        fieldId: 'orders_order_date',
                        descending: false,
                    },
                ],
                tableCalculations: [
                    {
                        name: 'cumulative_order_count',
                        displayName: 'Cumulative order count',
                        sql: 'SUM(${orders.unique_order_count})\nOVER(ORDER BY ${orders.order_date})',
                    },
                ],
            },
            chartConfig: {
                type: ChartType.CARTESIAN,
                config: {
                    layout: {
                        xField: 'orders_order_date',
                        yField: [
                            'orders_unique_order_count',
                            'cumulative_order_count',
                        ],
                    },
                    eChartsConfig: {
                        series: [
                            {
                                encode: {
                                    xRef: { field: 'orders_order_date' },
                                    yRef: {
                                        field: 'orders_unique_order_count',
                                    },
                                },
                                type: CartesianSeriesType.LINE,
                            },
                            {
                                encode: {
                                    xRef: { field: 'orders_order_date' },
                                    yRef: { field: 'cumulative_order_count' },
                                },
                                type: CartesianSeriesType.LINE,
                            },
                        ],
                    },
                },
            },
            tableConfig: {
                columnOrder: [
                    'orders_order_date',
                    'orders_unique_order_count',
                    'cumulative_order_count',
                ],
            },
            updatedByUser,
        },
    );

    await savedChartModel.create(
        SEED_PROJECT.project_uuid,
        SEED_ORG_1_ADMIN.user_uuid,
        {
            name: "What's the average spend per customer?",
            description: 'Average order size for each customer id',
            tableName: 'orders',
            metricQuery: {
                dimensions: ['customers_customer_id'],
                metrics: ['orders_average_order_size'],
                filters: {},
                limit: 500,
                sorts: [
                    { fieldId: 'orders_average_order_size', descending: true },
                ],
                tableCalculations: [],
            },
            chartConfig: {
                type: ChartType.CARTESIAN,
                config: {
                    layout: {
                        xField: 'customers_customer_id',
                        yField: ['orders_average_order_size'],
                        flipAxes: true,
                    },
                    eChartsConfig: {
                        series: [
                            {
                                encode: {
                                    xRef: { field: 'customers_customer_id' },
                                    yRef: {
                                        field: 'orders_average_order_size',
                                    },
                                },
                                type: CartesianSeriesType.BAR,
                            },
                        ],
                    },
                },
            },
            tableConfig: {
                columnOrder: [
                    'customers_customer_id',
                    'orders_average_order_size',
                ],
            },
            updatedByUser,
        },
    );

    await savedChartModel.create(
        SEED_PROJECT.project_uuid,
        SEED_ORG_1_ADMIN.user_uuid,
        {
            name: 'Which customers have not recently ordered an item?',
            description:
                'A table of the 20 customers that least recently placed an order with us',
            tableName: 'payments',
            metricQuery: {
                dimensions: [
                    'customers_customer_id',
                    'customers_days_since_last_order',
                    'customers_days_between_created_and_first_order',
                ],
                metrics: [
                    'payments_total_revenue',
                    'payments_unique_payment_count',
                ],
                filters: {},
                limit: 500,
                sorts: [
                    {
                        fieldId: 'customers_days_since_last_order',
                        descending: false,
                    },
                ],
                tableCalculations: [],
            },
            chartConfig: {
                type: ChartType.TABLE,
                config: undefined,
            },
            tableConfig: {
                columnOrder: [
                    'customers_customer_id',
                    'customers_days_since_last_order',
                    'customers_days_between_created_and_first_order',
                    'payments_total_revenue',
                    'payments_unique_payment_count',
                ],
            },
            updatedByUser,
        },
    );

    await savedChartModel.create(
        SEED_PROJECT.project_uuid,
        SEED_ORG_1_ADMIN.user_uuid,
        {
            name: 'How many orders did we get on February?',
            description:
                'A single value of the total number of orders received in February',
            tableName: 'orders',
            metricQuery: {
                dimensions: ['orders_order_date_month'],
                metrics: [
                    'orders_total_order_amount',
                    'orders_completed_order_count',
                ],
                filters: {
                    dimensions: {
                        id: '9e696bbe-6ef9-4352-94cc-5a297efd965a',
                        and: [
                            {
                                id: 'f00cfea4-0c92-4bac-b6fd-462b199f3db2',
                                target: {
                                    fieldId: 'orders_order_date_month',
                                },
                                operator: ConditionalOperator.EQUALS,
                                values: ['2018-02-01T00:00:00Z'],
                            },
                        ],
                    },
                },
                limit: 500,
                sorts: [
                    {
                        fieldId: 'orders_completed_order_count',
                        descending: false,
                    },
                ],
                tableCalculations: [],
            },
            chartConfig: {
                type: ChartType.TABLE,
                config: undefined,
            },
            tableConfig: {
                columnOrder: [
                    'orders_order_date_month',
                    'orders_total_order_amount',
                    'orders_completed_order_count',
                ],
            },
            updatedByUser,
        },
    );
}
