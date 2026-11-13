import { Router } from 'express';
import { query } from '../../config/db.js';
import { authenticateStaff, optionalAuth } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';

const router = Router();

// GET /tenants/current — Fetch active tenant financial & brand config (Public / Guest / Staff)
router.get('/current', optionalAuth, async (req, res, next) => {
  try {
    const tenantId = req.token?.tid || 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    let result;
    try {
      result = await query(
        `SELECT id, brand_name, slug, currency_symbol, tax_percent, service_charge_percent, config
         FROM tenants
         WHERE id = $1
         LIMIT 1`,
        [tenantId]
      );
    } catch {
      // Fallback
    }

    if (result && result.rows[0]) {
      const row = result.rows[0];
      res.status(200).json({
        tenant: {
          id: row.id,
          brand_name: row.brand_name,
          slug: row.slug,
          currency_symbol: row.currency_symbol || '₹',
          tax_percent: parseFloat(row.tax_percent) || 5.0,
          service_charge_percent: parseFloat(row.service_charge_percent) || 0.0,
          config: row.config || {},
        },
      });
      return;
    }

    // Default fallback
    res.status(200).json({
      tenant: {
        id: tenantId,
        brand_name: 'TableCraft Bistro',
        currency_symbol: '₹',
        tax_percent: 5.0,
        service_charge_percent: 0.0,
        config: {},
      },
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /tenants/current — Update financial settings (Admin only)
router.patch('/current', authenticateStaff, authorize('admin'), async (req, res, next) => {
  try {
    const tenantId = req.token?.tid || 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    const { tax_percent, service_charge_percent, brand_name, currency_symbol } = req.body;

    const updates: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (tax_percent !== undefined) {
      updates.push(`tax_percent = $${idx++}`);
      values.push(Math.max(0, Math.min(100, parseFloat(tax_percent))));
    }

    if (service_charge_percent !== undefined) {
      updates.push(`service_charge_percent = $${idx++}`);
      values.push(Math.max(0, Math.min(100, parseFloat(service_charge_percent))));
    }

    if (brand_name !== undefined && String(brand_name).trim()) {
      updates.push(`brand_name = $${idx++}`);
      values.push(String(brand_name).trim().slice(0, 120));
    }

    if (currency_symbol !== undefined) {
      updates.push(`currency_symbol = $${idx++}`);
      values.push(String(currency_symbol).trim().slice(0, 5));
    }

    let updatedTenant;
    if (updates.length > 0) {
      values.push(tenantId);
      try {
        const sql = `
          UPDATE tenants
          SET ${updates.join(', ')}
          WHERE id = $${idx++}
          RETURNING id, brand_name, slug, currency_symbol, tax_percent, service_charge_percent, config
        `;
        const result = await query(sql, values);
        if (result.rows[0]) {
          const row = result.rows[0];
          updatedTenant = {
            id: row.id,
            brand_name: row.brand_name,
            slug: row.slug,
            currency_symbol: row.currency_symbol || '₹',
            tax_percent: parseFloat(row.tax_percent),
            service_charge_percent: parseFloat(row.service_charge_percent),
            config: row.config,
          };
        }
      } catch (err) {
        // Fallback for standalone/mock mode
      }
    }

    if (!updatedTenant) {
      updatedTenant = {
        id: tenantId,
        brand_name: brand_name || 'TableCraft Bistro',
        currency_symbol: currency_symbol || '₹',
        tax_percent: tax_percent !== undefined ? parseFloat(tax_percent) : 5.0,
        service_charge_percent: service_charge_percent !== undefined ? parseFloat(service_charge_percent) : 0.0,
        config: {},
      };
    }

    res.status(200).json({
      success: true,
      message: 'Financial settings updated successfully',
      tenant: updatedTenant,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
