/**
 * Shared utilities for analysis scripts
 */

import { ConvexHttpClient } from "convex/browser";
import * as fs from "node:fs";
import * as path from "node:path";

/**
 * Get Convex URL from environment
 */
export function getConvexUrl(): string {
	const url = process.env.CONVEX_URL || process.env.VITE_CONVEX_URL;
	if (!url) {
		throw new Error(
			"CONVEX_URL not found. Please set CONVEX_URL or VITE_CONVEX_URL in your environment.",
		);
	}
	return url;
}

/**
 * Create a Convex client
 */
export function createConvexClient(): ConvexHttpClient {
	return new ConvexHttpClient(getConvexUrl());
}

/**
 * Ensure a directory exists, creating it if necessary
 */
export function ensureDir(dirPath: string): void {
	if (!fs.existsSync(dirPath)) {
		fs.mkdirSync(dirPath, { recursive: true });
	}
}

/**
 * Format bytes to human-readable size
 */
export function formatBytes(bytes: number, decimals = 2): string {
	if (bytes === 0) return "0 Bytes";

	const k = 1024;
	const dm = decimals < 0 ? 0 : decimals;
	const sizes = ["Bytes", "KB", "MB", "GB", "TB"];

	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return `${Number.parseFloat((bytes / k ** i).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Format duration in milliseconds to human-readable string
 */
export function formatDuration(ms: number): string {
	const seconds = Math.floor(ms / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);

	if (hours > 0) {
		return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
	}
	if (minutes > 0) {
		return `${minutes}m ${seconds % 60}s`;
	}
	return `${seconds}s`;
}

/**
 * Sleep for a given number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Progress bar for terminal output
 */
export class ProgressBar {
	private current = 0;
	private readonly total: number;
	private readonly barLength = 40;
	private readonly label: string;
	private startTime: number;

	constructor(total: number, label = "Progress") {
		this.total = total;
		this.label = label;
		this.startTime = Date.now();
	}

	update(current: number): void {
		this.current = current;
		this.render();
	}

	increment(): void {
		this.update(this.current + 1);
	}

	private render(): void {
		const percentage = Math.min(100, (this.current / this.total) * 100);
		const filled = Math.floor((this.barLength * this.current) / this.total);
		const empty = this.barLength - filled;

		const elapsed = Date.now() - this.startTime;
		const rate = this.current / (elapsed / 1000);
		const remaining = this.total - this.current;
		const eta = remaining / rate;

		const bar = "█".repeat(filled) + "░".repeat(empty);
		const stats = `${this.current}/${this.total} (${percentage.toFixed(1)}%)`;
		const time = Number.isFinite(eta) ? ` ETA: ${formatDuration(eta * 1000)}` : "";

		process.stdout.write(`\r${this.label}: [${bar}] ${stats}${time}`);

		if (this.current >= this.total) {
			process.stdout.write("\n");
		}
	}

	complete(): void {
		this.update(this.total);
	}
}

/**
 * Batch array into chunks
 */
export function batchArray<T>(array: T[], batchSize: number): T[][] {
	const batches: T[][] = [];
	for (let i = 0; i < array.length; i += batchSize) {
		batches.push(array.slice(i, i + batchSize));
	}
	return batches;
}

/**
 * Calculate statistics for a numeric array
 */
export interface Statistics {
	min: number;
	max: number;
	mean: number;
	median: number;
	sum: number;
	count: number;
	stdDev: number;
}

export function calculateStats(numbers: number[]): Statistics {
	if (numbers.length === 0) {
		throw new Error("Cannot calculate statistics for empty array");
	}

	const sorted = [...numbers].sort((a, b) => a - b);
	const sum = numbers.reduce((acc, n) => acc + n, 0);
	const mean = sum / numbers.length;

	const median =
		numbers.length % 2 === 0
			? (sorted[numbers.length / 2 - 1] + sorted[numbers.length / 2]) / 2
			: sorted[Math.floor(numbers.length / 2)];

	const variance =
		numbers.reduce((acc, n) => acc + (n - mean) ** 2, 0) / numbers.length;
	const stdDev = Math.sqrt(variance);

	return {
		min: sorted[0],
		max: sorted[sorted.length - 1],
		mean,
		median,
		sum,
		count: numbers.length,
		stdDev,
	};
}

/**
 * Generate a summary table for terminal output
 */
export function printTable(
	data: Record<string, string | number>[],
	headers: string[],
): void {
	// Calculate column widths
	const widths = headers.map((header, i) => {
		const headerWidth = header.length;
		const dataWidth = Math.max(
			...data.map((row) => String(Object.values(row)[i] || "").length),
		);
		return Math.max(headerWidth, dataWidth) + 2;
	});

	// Print header
	const headerRow = headers
		.map((h, i) => h.padEnd(widths[i]))
		.join(" | ");
	console.log(headerRow);
	console.log(widths.map((w) => "─".repeat(w)).join("─┼─"));

	// Print rows
	for (const row of data) {
		const rowStr = Object.values(row)
			.map((v, i) => String(v).padEnd(widths[i]))
			.join(" | ");
		console.log(rowStr);
	}
}

/**
 * Group items by a key function
 */
export function groupBy<T, K extends string | number>(
	items: T[],
	keyFn: (item: T) => K,
): Map<K, T[]> {
	const groups = new Map<K, T[]>();
	for (const item of items) {
		const key = keyFn(item);
		if (!groups.has(key)) {
			groups.set(key, []);
		}
		groups.get(key)?.push(item);
	}
	return groups;
}

/**
 * Count occurrences of items
 */
export function countBy<T, K extends string | number>(
	items: T[],
	keyFn: (item: T) => K,
): Map<K, number> {
	const counts = new Map<K, number>();
	for (const item of items) {
		const key = keyFn(item);
		counts.set(key, (counts.get(key) || 0) + 1);
	}
	return counts;
}
