import express from 'express';
import { prisma } from '../../utils/prisma/index.js';

const router = express.Router();

// Create Account
router.post('/account', async (req, res) => {
    const { email, password, isAdmin } = req.body;

    try {
        const account = await prisma.account.create({
            data: {
                email,
                password,
                isAdmin: isAdmin || false,
            },
        });
        res.status(201).json(account);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Create Manager
router.post('/manager', async (req, res) => {
    const { email, accountId, nickname, rating } = req.body;

    try {
        const manager = await prisma.manager.create({
            data: {
                email,
                accountId,
                nickname,
                rating,
                cash: 1000,
            },
        });
        res.status(201).json(manager);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get all Accounts
router.get('/accounts', async (req, res) => {
    try {
        const accounts = await prisma.account.findMany();
        res.status(200).json(accounts);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get all Managers
router.get('/managers', async (req, res) => {
    try {
        const managers = await prisma.manager.findMany();
        res.status(200).json(managers);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Update Account
router.put('/account/:id', async (req, res) => {
    const { id } = req.params;
    const { email, password, isAdmin } = req.body;

    try {
        const account = await prisma.account.update({
            where: { accountId: Number(id) },
            data: {
                email,
                password,
                isAdmin,
            },
        });
        res.status(200).json(account);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Update Manager
router.put('/manager/:id', async (req, res) => {
    const { id } = req.params;
    const { email, nickname, cash, recordId, rating } = req.body;

    try {
        const manager = await prisma.manager.update({
            where: { managerId: Number(id) },
            data: {
                email,
                nickname,
                cash,
                recordId,
                rating,
            },
        });
        res.status(200).json(manager);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Delete Account
router.delete('/account/:id', async (req, res) => {
    const { id } = req.params;

    try {
        await prisma.account.delete({
            where: { accountId: Number(id) },
        });
        res.status(204).send();
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Delete Manager
router.delete('/manager/:id', async (req, res) => {
    const { id } = req.params;

    try {
        await prisma.manager.delete({
            where: { managerId: Number(id) },
        });
        res.status(204).send();
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

export default router;
