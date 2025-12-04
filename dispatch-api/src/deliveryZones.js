/**
 * Delivery zones configuration
 * Each zone has different delivery times and costs
 */

module.exports = [
    {
        name: 'Express',
        keywords: ['centro', 'downtown', 'city center', 'norte'],
        deliveryDays: 1,
        cost: 10.00,
        available: true,
        description: 'Same day or next day delivery for central areas'
    },
    {
        name: 'Standard',
        keywords: ['sur', 'south', 'este', 'east', 'oeste', 'west'],
        deliveryDays: 3,
        cost: 5.00,
        available: true,
        description: 'Standard delivery for most urban areas'
    },
    {
        name: 'Extended',
        keywords: ['rural', 'remoto', 'remote', 'provincia', 'province'],
        deliveryDays: 5,
        cost: 15.00,
        available: true,
        description: 'Extended delivery for remote or rural areas'
    },
    {
        name: 'Premium',
        keywords: ['urgente', 'urgent', 'express', 'premium'],
        deliveryDays: 1,
        cost: 20.00,
        available: true,
        description: 'Premium express delivery service'
    }
];
