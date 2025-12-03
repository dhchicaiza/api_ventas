import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Schema for validation
const personSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    address: z.string().min(1, "Address is required"),
});

export const createPerson = async (req: Request, res: Response) => {
    try {
        const data = personSchema.parse(req.body);
        const person = await prisma.person.create({ data });
        res.status(201).json(person);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: error.errors });
        } else {
            console.error('Error creating person:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
};

export const getPersons = async (req: Request, res: Response) => {
    try {
        const persons = await prisma.person.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(persons);
    } catch (error) {
        console.error('Error fetching persons:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const getPerson = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const person = await prisma.person.findUnique({ where: { id } });
        if (!person) return res.status(404).json({ error: 'Person not found' });
        res.json(person);
    } catch (error) {
        console.error('Error fetching person:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const updatePerson = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const data = personSchema.parse(req.body);
        const person = await prisma.person.update({
            where: { id },
            data
        });
        res.json(person);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: error.errors });
        } else {
            // Prisma error P2025 is "Record to update not found"
            console.error('Error updating person:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
};

export const deletePerson = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.person.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting person:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
