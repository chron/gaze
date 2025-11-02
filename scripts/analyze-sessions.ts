#!/usr/bin/env tsx
/**
 * Session Analysis Script
 *
 * This script analyzes user activity patterns from the messages table:
 * 1. Extracts all user message timestamps from Convex
 * 2. Exports raw data to CSV
 * 3. Merges nearby messages into sessions (within 5 minutes)
 * 4. Exports session data to CSV
 * 5. Generates visualizations:
 *    - Distribution of session durations
 *    - Hours played per day
 *    - Activity breakdown by time of day
 *    - Day of week patterns
 *    - Session length trends over time
 *
 * Usage:
 *   pnpm tsx scripts/analyze-sessions.ts
 */

import * as fs from "node:fs"
import * as path from "node:path"
import { ConvexHttpClient } from "convex/browser"
import { createObjectCsvWriter } from "csv-writer"
import {
	differenceInMinutes,
	format,
	getDay,
	getHours,
	parseISO,
} from "date-fns"
import { api } from "../convex/_generated/api"
import { ensureDir, getConvexUrl } from "./utils"

// Configuration
const SESSION_GAP_MINUTES = 10 // Messages within this gap are considered part of the same session
const OUTPUT_DIR = "./data/sessions"

interface MessageTimestamp {
	_creationTime: number
	role: string
}

interface SessionData {
	sessionNumber: number
	startTime: string
	endTime: string
	durationMinutes: number
	messageCount: number
	date: string
	dayOfWeek: string
	startHour: number
}

interface RawMessageData {
	timestamp: string
	unixTime: number
}

// Fetch all user messages from Convex with pagination
async function fetchAllUserMessages(
	client: ConvexHttpClient,
): Promise<number[]> {
	console.log("Fetching user messages from Convex...")
	const timestamps: number[] = []
	let cursor: string | null = null
	let pageCount = 0

	do {
		const result = await client.query(api.messages.getUserMessageTimestamps, {
			cursor: cursor || undefined,
		})

		timestamps.push(...result.timestamps)
		pageCount++

		console.log(
			`  Page ${pageCount}: fetched ${result.timestamps.length} messages (total: ${timestamps.length})`,
		)

		// Stop if we got no results or there's no more cursor
		if (result.timestamps.length === 0 || !result.cursor) {
			break
		}

		cursor = result.cursor
	} while (true)

	console.log(`✓ Fetched ${timestamps.length} total user messages\n`)
	return timestamps
}

// Export raw timestamps to CSV
async function exportRawData(timestamps: number[]): Promise<void> {
	console.log("Exporting raw data to CSV...")

	const csvWriter = createObjectCsvWriter({
		path: path.join(OUTPUT_DIR, "raw-messages.csv"),
		header: [
			{ id: "timestamp", title: "Timestamp" },
			{ id: "unixTime", title: "Unix Time" },
		],
	})

	const records: RawMessageData[] = timestamps.map((ts) => ({
		timestamp: new Date(ts).toISOString(),
		unixTime: ts,
	}))

	await csvWriter.writeRecords(records)
	console.log(`✓ Exported ${records.length} records to raw-messages.csv\n`)
}

// Merge nearby messages into sessions
function createSessions(timestamps: number[]): SessionData[] {
	console.log("Creating sessions from timestamps...")

	if (timestamps.length === 0) {
		return []
	}

	// Sort timestamps chronologically
	const sortedTimestamps = [...timestamps].sort((a, b) => a - b)

	const sessions: SessionData[] = []
	let currentSession: number[] = [sortedTimestamps[0]]

	for (let i = 1; i < sortedTimestamps.length; i++) {
		const prevTimestamp = sortedTimestamps[i - 1]
		const currentTimestamp = sortedTimestamps[i]
		const gapMinutes = differenceInMinutes(currentTimestamp, prevTimestamp)

		if (gapMinutes <= SESSION_GAP_MINUTES) {
			// Continue current session
			currentSession.push(currentTimestamp)
		} else {
			// End current session and start new one
			sessions.push(createSessionData(currentSession, sessions.length + 1))
			currentSession = [currentTimestamp]
		}
	}

	// Add the last session
	sessions.push(createSessionData(currentSession, sessions.length + 1))

	console.log(
		`✓ Created ${sessions.length} sessions from ${timestamps.length} messages\n`,
	)
	return sessions
}

// Create session data object
function createSessionData(
	timestamps: number[],
	sessionNumber: number,
): SessionData {
	const startTime = timestamps[0]
	const endTime = timestamps[timestamps.length - 1]
	const startDate = new Date(startTime)

	const dayNames = [
		"Sunday",
		"Monday",
		"Tuesday",
		"Wednesday",
		"Thursday",
		"Friday",
		"Saturday",
	]

	return {
		sessionNumber,
		startTime: new Date(startTime).toISOString(),
		endTime: new Date(endTime).toISOString(),
		durationMinutes: differenceInMinutes(endTime, startTime),
		messageCount: timestamps.length,
		date: format(startDate, "yyyy-MM-dd"),
		dayOfWeek: dayNames[getDay(startDate)],
		startHour: getHours(startDate),
	}
}

// Export session data to CSV
async function exportSessionData(sessions: SessionData[]): Promise<void> {
	console.log("Exporting session data to CSV...")

	const csvWriter = createObjectCsvWriter({
		path: path.join(OUTPUT_DIR, "sessions.csv"),
		header: [
			{ id: "sessionNumber", title: "Session #" },
			{ id: "startTime", title: "Start Time" },
			{ id: "endTime", title: "End Time" },
			{ id: "durationMinutes", title: "Duration (minutes)" },
			{ id: "messageCount", title: "Message Count" },
			{ id: "date", title: "Date" },
			{ id: "dayOfWeek", title: "Day of Week" },
			{ id: "startHour", title: "Start Hour" },
		],
	})

	await csvWriter.writeRecords(sessions)
	console.log(`✓ Exported ${sessions.length} sessions to sessions.csv\n`)
}

// Generate HTML visualization with multiple charts
function generateVisualizations(sessions: SessionData[]): void {
	console.log("Generating visualizations...")

	if (sessions.length === 0) {
		console.log("⚠ No sessions to visualize\n")
		return
	}

	// biome-ignore lint/suspicious/noExplicitAny: Plotly trace types are complex
	const traces: any[] = []
	// biome-ignore lint/suspicious/noExplicitAny: Plotly layout types are complex
	const layouts: any[] = []

	// 1. Distribution of session durations (histogram)
	const durations = sessions.map((s) => s.durationMinutes)
	traces.push({
		type: "histogram",
		x: durations,
		nbinsx: 30,
		name: "Session Duration",
		marker: { color: "#8b5cf6" },
	})
	layouts.push({
		title: "Distribution of Session Durations",
		xaxis: { title: "Duration (minutes)" },
		yaxis: { title: "Number of Sessions" },
		showlegend: false,
	})

	// 2. Hours per day (bar chart)
	const hoursPerDay = new Map<string, number>()
	for (const session of sessions) {
		const current = hoursPerDay.get(session.date) || 0
		hoursPerDay.set(session.date, current + session.durationMinutes / 60)
	}

	const sortedDates = Array.from(hoursPerDay.keys()).sort()
	const hoursValues = sortedDates.map((date) => hoursPerDay.get(date) || 0)

	traces.push({
		type: "bar",
		x: sortedDates,
		y: hoursValues,
		name: "Hours Played",
		marker: { color: "#10b981" },
	})
	layouts.push({
		title: "Hours Played Per Day",
		xaxis: { title: "Date" },
		yaxis: { title: "Hours" },
		showlegend: false,
	})

	// 3. Activity by time of day (histogram)
	const startHours = sessions.map((s) => s.startHour)
	traces.push({
		type: "histogram",
		x: startHours,
		nbinsx: 24,
		name: "Sessions by Hour",
		marker: { color: "#f59e0b" },
	})
	layouts.push({
		title: "Activity by Time of Day",
		xaxis: { title: "Hour of Day (0-23)", dtick: 2 },
		yaxis: { title: "Number of Sessions" },
		showlegend: false,
	})

	// 4. Day of week distribution
	const dayOrder = [
		"Monday",
		"Tuesday",
		"Wednesday",
		"Thursday",
		"Friday",
		"Saturday",
		"Sunday",
	]
	const dayCount = new Map<string, number>()
	for (const session of sessions) {
		dayCount.set(session.dayOfWeek, (dayCount.get(session.dayOfWeek) || 0) + 1)
	}

	traces.push({
		type: "bar",
		x: dayOrder,
		y: dayOrder.map((day) => dayCount.get(day) || 0),
		name: "Sessions by Day",
		marker: { color: "#ef4444" },
	})
	layouts.push({
		title: "Sessions by Day of Week",
		xaxis: { title: "Day of Week" },
		yaxis: { title: "Number of Sessions" },
		showlegend: false,
	})

	// 5. Session length over time (scatter with trend)
	const sessionDates = sessions.map((s) => s.startTime)
	const sessionDurations = sessions.map((s) => s.durationMinutes)

	traces.push({
		type: "scatter",
		mode: "markers",
		x: sessionDates,
		y: sessionDurations,
		name: "Session Duration",
		marker: { color: "#8b5cf6", size: 6 },
	})
	layouts.push({
		title: "Session Duration Over Time",
		xaxis: { title: "Date" },
		yaxis: { title: "Duration (minutes)" },
		showlegend: false,
	})

	// 6. Cumulative hours played
	const cumulativeHours: number[] = []
	let total = 0
	for (const session of sessions) {
		total += session.durationMinutes / 60
		cumulativeHours.push(total)
	}

	traces.push({
		type: "scatter",
		mode: "lines",
		x: sessionDates,
		y: cumulativeHours,
		name: "Cumulative Hours",
		line: { color: "#06b6d4", width: 2 },
	})
	layouts.push({
		title: "Cumulative Hours Played",
		xaxis: { title: "Date" },
		yaxis: { title: "Total Hours" },
		showlegend: false,
	})

	// Generate HTML with all charts
	const html = generateHTMLReport(traces, layouts, sessions)
	const htmlPath = path.join(OUTPUT_DIR, "analysis.html")
	fs.writeFileSync(htmlPath, html)

	console.log("✓ Generated visualizations in analysis.html\n")
}

// Generate HTML report with embedded charts
function generateHTMLReport(
	// biome-ignore lint/suspicious/noExplicitAny: Plotly trace types are complex and not worth typing for this use case
	traces: any[],
	// biome-ignore lint/suspicious/noExplicitAny: Plotly layout types are complex and not worth typing for this use case
	layouts: any[],
	sessions: SessionData[],
): string {
	const totalSessions = sessions.length
	const totalMinutes = sessions.reduce((sum, s) => sum + s.durationMinutes, 0)
	const totalHours = totalMinutes / 60
	const avgSessionMinutes = totalMinutes / totalSessions
	const totalMessages = sessions.reduce((sum, s) => sum + s.messageCount, 0)

	const longestSession = sessions.reduce(
		(max, s) => (s.durationMinutes > max.durationMinutes ? s : max),
		sessions[0],
	)

	const chartDivs = traces
		.map((_, i) => `<div id="chart${i}" class="chart"></div>`)
		.join("\n      ")

	const chartScripts = traces
		.map(
			(trace, i) =>
				`Plotly.newPlot('chart${i}', [${JSON.stringify(trace)}], ${JSON.stringify(layouts[i])});`,
		)
		.join("\n      ")

	return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Session Analysis - Gaze Into The Abyss</title>
  <script src="https://cdn.plot.ly/plotly-2.27.0.min.js"></script>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      max-width: 1400px;
      margin: 0 auto;
      padding: 2rem;
      background: #0f0f0f;
      color: #e5e5e5;
    }
    h1 {
      font-size: 2.5rem;
      margin-bottom: 0.5rem;
      color: #ffffff;
    }
    .subtitle {
      color: #a1a1a1;
      margin-bottom: 2rem;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .stat-card {
      background: #1a1a1a;
      padding: 1.5rem;
      border-radius: 8px;
      border: 1px solid #2a2a2a;
    }
    .stat-value {
      font-size: 2rem;
      font-weight: bold;
      color: #8b5cf6;
      margin-bottom: 0.25rem;
    }
    .stat-label {
      color: #a1a1a1;
      font-size: 0.875rem;
    }
    .chart {
      background: #1a1a1a;
      border-radius: 8px;
      padding: 1rem;
      margin-bottom: 2rem;
      border: 1px solid #2a2a2a;
    }
    .footer {
      margin-top: 3rem;
      padding-top: 2rem;
      border-top: 1px solid #2a2a2a;
      color: #6b7280;
      font-size: 0.875rem;
      text-align: center;
    }
  </style>
</head>
<body>
  <h1>📊 Session Analysis</h1>
  <div class="subtitle">Gaze Into The Abyss - Player Activity Report</div>

  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-value">${totalSessions}</div>
      <div class="stat-label">Total Sessions</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${totalHours.toFixed(1)}</div>
      <div class="stat-label">Total Hours</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${avgSessionMinutes.toFixed(0)}</div>
      <div class="stat-label">Avg Session (min)</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${totalMessages.toLocaleString()}</div>
      <div class="stat-label">Total Messages</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${longestSession.durationMinutes}</div>
      <div class="stat-label">Longest Session (min)</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${format(parseISO(sessions[0].startTime), "MMM d")}</div>
      <div class="stat-label">First Session</div>
    </div>
  </div>

  <div id="charts">
      ${chartDivs}
  </div>

  <div class="footer">
    Generated on ${format(new Date(), "PPpp")}
  </div>

  <script>
    // Apply dark theme to all charts
    const darkLayout = {
      paper_bgcolor: '#1a1a1a',
      plot_bgcolor: '#1a1a1a',
      font: { color: '#e5e5e5' },
      xaxis: { gridcolor: '#2a2a2a', zerolinecolor: '#2a2a2a' },
      yaxis: { gridcolor: '#2a2a2a', zerolinecolor: '#2a2a2a' }
    };

    ${chartScripts}
  </script>
</body>
</html>`
}

// Print summary statistics
function printSummary(sessions: SessionData[]): void {
	if (sessions.length === 0) {
		console.log("No sessions found.")
		return
	}

	const totalMinutes = sessions.reduce((sum, s) => sum + s.durationMinutes, 0)
	const avgMinutes = totalMinutes / sessions.length
	const totalMessages = sessions.reduce((sum, s) => sum + s.messageCount, 0)

	const longestSession = sessions.reduce((max, s) =>
		s.durationMinutes > max.durationMinutes ? s : max,
	)

	const shortestSession = sessions.reduce((min, s) =>
		s.durationMinutes < min.durationMinutes ? s : min,
	)

	console.log("═══════════════════════════════════════")
	console.log("📊 SESSION ANALYSIS SUMMARY")
	console.log("═══════════════════════════════════════")
	console.log(`Total Sessions:      ${sessions.length}`)
	console.log(`Total Messages:      ${totalMessages.toLocaleString()}`)
	console.log(`Total Time:          ${(totalMinutes / 60).toFixed(1)} hours`)
	console.log(`Average Session:     ${avgMinutes.toFixed(1)} minutes`)
	console.log(`Shortest Session:    ${shortestSession.durationMinutes} minutes`)
	console.log(`Longest Session:     ${longestSession.durationMinutes} minutes`)
	console.log(
		`First Session:       ${format(parseISO(sessions[0].startTime), "PPpp")}`,
	)
	console.log(
		`Last Session:        ${format(parseISO(sessions[sessions.length - 1].startTime), "PPpp")}`,
	)
	console.log("═══════════════════════════════════════\n")

	console.log("✅ Analysis complete!")
	console.log(`📁 Results saved to: ${path.resolve(OUTPUT_DIR)}/`)
	console.log("   - raw-messages.csv: All user message timestamps")
	console.log("   - sessions.csv: Merged session data")
	console.log("   - analysis.html: Interactive visualizations")
}

// Main execution
async function main() {
	console.log("\n🎲 Starting Session Analysis\n")

	// Setup
	const convexUrl = getConvexUrl()
	ensureDir(OUTPUT_DIR)
	const client = new ConvexHttpClient(convexUrl)

	try {
		// Step 1: Fetch data
		const timestamps = await fetchAllUserMessages(client)

		if (timestamps.length === 0) {
			console.log("⚠ No user messages found. Exiting.")
			return
		}

		// Step 2: Export raw data
		await exportRawData(timestamps)

		// Step 3: Create sessions
		const sessions = createSessions(timestamps)

		// Step 4: Export session data
		await exportSessionData(sessions)

		// Step 5: Generate visualizations
		generateVisualizations(sessions)

		// Step 6: Print summary
		printSummary(sessions)
	} catch (error) {
		console.error("\n❌ Error during analysis:", error)
		process.exit(1)
	}
}

// Run the script
main()
