"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.REGION_DELIVERY_BASE = exports.DELIVERY_FEES = exports.FREE_DELIVERY_THRESHOLD_USD = void 0;
exports.computeDelivery = computeDelivery;
exports.FREE_DELIVERY_THRESHOLD_USD = 50;
exports.DELIVERY_FEES = {
    express_beirut: 3,
    standard: 2,
    diaspora_air: 28,
};
exports.REGION_DELIVERY_BASE = {
    beirut: { baseUSD: 3.0, expressAvailable: true },
    mount_lebanon: { baseUSD: 4.5, expressAvailable: true },
    north: { baseUSD: 5.0, expressAvailable: false },
    south: { baseUSD: 5.5, expressAvailable: false },
    bekaa: { baseUSD: 5.5, expressAvailable: false },
    diaspora_global: { baseUSD: 28.0, expressAvailable: true },
};
function normalizeGovKey(gov) {
    if (!gov)
        return '';
    const s = gov.toLowerCase().trim();
    if (s.includes('diaspora') || s.includes('international'))
        return 'diaspora_global';
    if (s.includes('beirut') || s.includes('بيروت'))
        return 'beirut';
    if (s.includes('mount') || s.includes('جبل'))
        return 'mount_lebanon';
    if (s.includes('north') || s.includes('akkar') || s.includes('شمال'))
        return 'north';
    if (s.includes('south') || s.includes('nabatieh') || s.includes('جنوب'))
        return 'south';
    if (s.includes('bekaa') || s.includes('بقاع'))
        return 'bekaa';
    return s;
}
function computeDelivery(speed = 'standard', governorate, netSubtotalUSD = 0) {
    const govKey = normalizeGovKey(governorate);
    const isDiaspora = govKey === 'diaspora_global' || speed === 'diaspora_air' || speed === 'diaspora_global';
    if (isDiaspora) {
        return exports.DELIVERY_FEES.diaspora_air;
    }
    // Free delivery threshold for all domestic Lebanese governorates
    if (netSubtotalUSD >= exports.FREE_DELIVERY_THRESHOLD_USD) {
        return 0;
    }
    const regionInfo = exports.REGION_DELIVERY_BASE[govKey];
    if (regionInfo) {
        if (speed === 'express_beirut') {
            return regionInfo.expressAvailable ? regionInfo.baseUSD : regionInfo.baseUSD + 1.5;
        }
        return regionInfo.baseUSD;
    }
    if (speed === 'express_beirut') {
        return exports.DELIVERY_FEES.express_beirut;
    }
    return exports.DELIVERY_FEES.standard;
}
//# sourceMappingURL=delivery.js.map