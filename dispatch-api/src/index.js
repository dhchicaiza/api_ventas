const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3002;

// In-memory storage
const dispatches = new Map();
const deliveryZones = require('./deliveryZones');

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// ==================== DELIVERY AVAILABILITY ====================

/**
 * Check delivery availability for an address
 * POST /api/dispatch/check-availability
 */
app.post('/api/dispatch/check-availability', (req, res) => {
    const { address } = req.body;

    if (!address || address.trim().length < 5) {
        return res.status(400).json({
            error: 'Invalid address',
            message: 'Address must be at least 5 characters long'
        });
    }

    // Simulate zone detection based on address keywords
    const addressLower = address.toLowerCase();
    let zone = deliveryZones.find(z =>
        z.keywords.some(keyword => addressLower.includes(keyword))
    );

    // Default zone if no match
    if (!zone) {
        zone = deliveryZones.find(z => z.name === 'Standard');
    }

    // Calculate estimated delivery date
    const estimatedDate = new Date();
    estimatedDate.setDate(estimatedDate.getDate() + zone.deliveryDays);
    estimatedDate.setHours(0, 0, 0, 0); // Set to start of day

    console.log(`[AVAILABILITY CHECK] Address: "${address}" -> Zone: ${zone.name}, Days: ${zone.deliveryDays}`);

    res.json({
        available: zone.available,
        estimatedDeliveryDate: estimatedDate.toISOString(),
        deliveryDays: zone.deliveryDays,
        zone: zone.name,
        deliveryCost: zone.cost
    });
});

// ==================== DISPATCH MANAGEMENT ====================

/**
 * Create a new dispatch
 * POST /api/dispatch/create
 */
app.post('/api/dispatch/create', (req, res) => {
    const { saleId, customerName, customerAddress, customerEmail, deliveryDate, items } = req.body;

    // Validation
    if (!saleId || !customerName || !customerAddress || !customerEmail || !items || !Array.isArray(items)) {
        return res.status(400).json({
            error: 'Invalid data',
            message: 'saleId, customerName, customerAddress, customerEmail, and items are required'
        });
    }

    if (items.length === 0) {
        return res.status(400).json({
            error: 'Invalid data',
            message: 'At least one item is required'
        });
    }

    // Create dispatch
    const dispatchId = `DISPATCH-${Date.now()}-${uuidv4().split('-')[0]}`;
    const trackingNumber = `TRK-${Date.now()}`;
    const now = new Date();

    // Use provided delivery date or calculate default (3 days)
    let estimatedDeliveryDate;
    if (deliveryDate) {
        estimatedDeliveryDate = new Date(deliveryDate);
    } else {
        estimatedDeliveryDate = new Date();
        estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + 3);
    }

    const dispatch = {
        id: dispatchId,
        saleId,
        trackingNumber,
        status: 'PENDING',
        customer: {
            name: customerName,
            address: customerAddress,
            email: customerEmail
        },
        items: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            description: item.description || ''
        })),
        estimatedDeliveryDate: estimatedDeliveryDate.toISOString(),
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        history: [
            {
                status: 'PENDING',
                timestamp: now.toISOString(),
                location: 'Warehouse',
                notes: 'Dispatch created and pending processing'
            }
        ]
    };

    dispatches.set(dispatchId, dispatch);

    console.log(`[DISPATCH CREATED] ${dispatchId} - Sale: ${saleId}, Items: ${items.length}, Delivery: ${estimatedDeliveryDate.toISOString()}`);

    res.status(201).json({
        dispatchId: dispatch.id,
        status: dispatch.status,
        trackingNumber: dispatch.trackingNumber,
        estimatedDeliveryDate: dispatch.estimatedDeliveryDate,
        createdAt: dispatch.createdAt
    });
});

/**
 * Get dispatch by ID
 * GET /api/dispatch/:dispatchId
 */
app.get('/api/dispatch/:dispatchId', (req, res) => {
    const { dispatchId } = req.params;

    const dispatch = dispatches.get(dispatchId);

    if (!dispatch) {
        return res.status(404).json({
            error: 'Dispatch not found',
            dispatchId
        });
    }

    res.json(dispatch);
});

/**
 * Update dispatch status
 * PATCH /api/dispatch/:dispatchId/status
 */
app.patch('/api/dispatch/:dispatchId/status', (req, res) => {
    const { dispatchId } = req.params;
    const { status, location, notes } = req.body;

    const dispatch = dispatches.get(dispatchId);

    if (!dispatch) {
        return res.status(404).json({
            error: 'Dispatch not found',
            dispatchId
        });
    }

    const validStatuses = ['PENDING', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'RETURNED'];

    if (!validStatuses.includes(status)) {
        return res.status(400).json({
            error: 'Invalid status',
            message: `Status must be one of: ${validStatuses.join(', ')}`
        });
    }

    // Update dispatch
    dispatch.status = status;
    dispatch.updatedAt = new Date().toISOString();

    // Add to history
    dispatch.history.push({
        status,
        timestamp: dispatch.updatedAt,
        location: location || 'Unknown',
        notes: notes || `Status updated to ${status}`
    });

    console.log(`[DISPATCH UPDATED] ${dispatchId} - New status: ${status}`);

    res.json({
        dispatchId: dispatch.id,
        status: dispatch.status,
        updatedAt: dispatch.updatedAt
    });
});

/**
 * Get all dispatches (debug)
 * GET /api/dispatch
 */
app.get('/api/dispatch', (req, res) => {
    const { status, saleId } = req.query;

    let allDispatches = Array.from(dispatches.values());

    // Filter by status
    if (status) {
        allDispatches = allDispatches.filter(d => d.status === status);
    }

    // Filter by saleId
    if (saleId) {
        allDispatches = allDispatches.filter(d => d.saleId === saleId);
    }

    res.json({
        data: allDispatches,
        total: allDispatches.length
    });
});

// ==================== UTILITIES ====================

/**
 * Health check
 * GET /health
 */
app.get('/health', (req, res) => {
    const statusCounts = {};
    Array.from(dispatches.values()).forEach(d => {
        statusCounts[d.status] = (statusCounts[d.status] || 0) + 1;
    });

    res.json({
        status: 'healthy',
        service: 'dispatch-api',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        stats: {
            totalDispatches: dispatches.size,
            byStatus: statusCounts,
            deliveryZones: deliveryZones.length
        }
    });
});

/**
 * Get delivery zones
 * GET /api/dispatch/zones
 */
app.get('/api/dispatch/zones', (req, res) => {
    res.json({
        data: deliveryZones,
        total: deliveryZones.length
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        path: req.path,
        method: req.method
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: err.message
    });
});

// Start server
app.listen(PORT, () => {
    console.log('='.repeat(60));
    console.log('🚚 DISPATCH API MOCK - RUNNING');
    console.log('='.repeat(60));
    console.log(`📡 Server: http://localhost:${PORT}`);
    console.log(`🏥 Health: http://localhost:${PORT}/health`);
    console.log(`🌍 Delivery Zones: ${deliveryZones.length} configured`);
    console.log('='.repeat(60));
    console.log('\n📋 Available Endpoints:');
    console.log('  POST   /api/dispatch/check-availability');
    console.log('  POST   /api/dispatch/create');
    console.log('  GET    /api/dispatch/:id');
    console.log('  PATCH  /api/dispatch/:id/status');
    console.log('\n🔧 Debug Endpoints:');
    console.log('  GET    /api/dispatch (all dispatches)');
    console.log('  GET    /api/dispatch/zones (delivery zones)');
    console.log('  GET    /health (health check)');
    console.log('='.repeat(60));
    console.log('');
});
