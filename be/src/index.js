"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/index.ts
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const fs_1 = require("fs");
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const PORT = process.env.PORT || 3001;
// API key management
app.post('/api/apikey', (req, res) => {
    const { apiKey } = req.body;
    try {
        (0, fs_1.writeFileSync)('.env', `OPENAI_API_KEY=${apiKey}\n`);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to save API key' });
    }
});
app.get('/api/apikey', (req, res) => {
    var _a;
    try {
        const envContent = (0, fs_1.readFileSync)('.env', 'utf-8');
        const apiKey = ((_a = envContent.match(/OPENAI_API_KEY=(.*)/)) === null || _a === void 0 ? void 0 : _a[1]) || '';
        res.json({ apiKey });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to read API key' });
    }
});
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
