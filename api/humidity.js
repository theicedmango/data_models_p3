import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("Missing MONGODB_URI environment variable");
}

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = new MongoClient(uri);
  await client.connect();

  const db = client.db("humidity_app");

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

function getThresholdStatus(humidity) {
  if (humidity <= 45) return "low";
  if (humidity <= 60) return "medium";
  return "high";
}

function getRangeStart(range) {
  const now = new Date();

  switch (range) {
    case "24h":
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case "week":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "month":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
  }
}

function roundNumber(value) {
  return Math.round(value * 10) / 10;
}

function formatLabel(date, range) {
  const d = new Date(date);

  if (range === "24h") {
    return d.toLocaleTimeString("en-CA", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "America/Toronto",
    });
  }

  return d.toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
    timeZone: "America/Toronto",
  });
}

function sampleDocs(docs, maxPoints) {
  if (docs.length <= maxPoints) return docs;

  const sampled = [];
  const lastIndex = docs.length - 1;

  for (let i = 0; i < maxPoints; i++) {
    const index = Math.round((i / (maxPoints - 1)) * lastIndex);
    sampled.push(docs[index]);
  }

  return sampled;
}

function groupDocsByDay(docs) {
  const grouped = new Map();

  docs.forEach((doc) => {
    const d = new Date(doc.createdAt);

    const key = d.toLocaleDateString("en-CA", {
      timeZone: "America/Toronto",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    if (!grouped.has(key)) {
      grouped.set(key, []);
    }

    grouped.get(key).push(doc);
  });

  return Array.from(grouped.values()).map((group) => {
    const avgHumidity =
      group.reduce((sum, doc) => sum + Number(doc.humidity), 0) / group.length;

    return {
      createdAt: group[group.length - 1].createdAt,
      humidity: avgHumidity,
      source: group[group.length - 1].source || "unknown",
    };
  });
}

function countUniqueDays(docs) {
  const uniqueDays = new Set();

  docs.forEach((doc) => {
    const d = new Date(doc.createdAt);
    const key = d.toLocaleDateString("en-CA", {
      timeZone: "America/Toronto",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    uniqueDays.add(key);
  });

  return uniqueDays.size;
}

function calculateRiskHours(rawDocs, threshold = 60) {
  let riskHours = 0;

  for (let i = 1; i < rawDocs.length; i++) {
    const prev = rawDocs[i - 1];
    const curr = rawDocs[i];

    if (Number(prev.humidity) > threshold) {
      const diffMs =
        new Date(curr.createdAt).getTime() - new Date(prev.createdAt).getTime();
      riskHours += diffMs / (1000 * 60 * 60);
    }
  }

  return roundNumber(riskHours);
}

export default async function handler(req, res) {
  try {
    const { db } = await connectToDatabase();
    const readings = db.collection("readings");

    if (req.method === "POST") {
      const { city, humidity, source } = req.body || {};

      if (!city || humidity === undefined || humidity === null) {
        return res.status(400).json({
          error: "Missing required fields: city and humidity",
        });
      }

      const parsedHumidity = Number(humidity);

      if (Number.isNaN(parsedHumidity)) {
        return res.status(400).json({
          error: "Humidity must be a valid number",
        });
      }

      const newReading = {
        city,
        humidity: parsedHumidity,
        source: source || "esp32",
        createdAt: new Date(),
      };

      await readings.insertOne(newReading);

      return res.status(201).json({
        success: true,
        message: "Humidity reading saved",
        reading: {
          city: newReading.city,
          humidity: roundNumber(newReading.humidity),
          source: newReading.source,
          createdAt: newReading.createdAt,
        },
      });
    }

    if (req.method === "GET") {
      const city = req.query.city || "Sensor";
      const range = req.query.range || "24h";
      const startDate = getRangeStart(range);

      // raw docs for calculations / latest
      const rawDocs = await readings
        .find({
          city,
          createdAt: { $gte: startDate },
        })
        .sort({ createdAt: 1 })
        .toArray();

      if (!rawDocs.length) {
        return res.status(200).json({
          city,
          range,
          labels: [],
          series: [],
          avg: 0,
          high: 0,
          low: 0,
          latest: null,
          status: "unknown",
          riskHours: 0,
          uniqueDays: 0,
        });
      }

      const latestRaw = rawDocs[rawDocs.length - 1];
      const uniqueDays = countUniqueDays(rawDocs);

      let chartDocs = [...rawDocs];

      if (range === "24h") {
        // sample down hard so the chart stays readable
        chartDocs = sampleDocs(rawDocs, 12);
      } else if (range === "week" || range === "month") {
        // one point per day
        chartDocs = groupDocsByDay(rawDocs);
      }

      const labels = chartDocs.map((doc) => formatLabel(doc.createdAt, range));
      const series = chartDocs.map((doc) => roundNumber(Number(doc.humidity)));

      const allHumidities = rawDocs.map((doc) => Number(doc.humidity));
      const avg =
        allHumidities.reduce((sum, val) => sum + val, 0) / allHumidities.length;
      const high = Math.max(...allHumidities);
      const low = Math.min(...allHumidities);
      const riskHours = calculateRiskHours(rawDocs, 60);

      return res.status(200).json({
        city,
        range,
        labels,
        series,
        avg: roundNumber(avg),
        high: roundNumber(high),
        low: roundNumber(low),
        latest: {
          humidity: roundNumber(Number(latestRaw.humidity)),
          createdAt: latestRaw.createdAt,
          source: latestRaw.source || "unknown",
        },
        status: getThresholdStatus(Number(latestRaw.humidity)),
        riskHours,
        uniqueDays,
      });
    }

    return res.status(405).json({
      error: "Method not allowed",
    });
  } catch (error) {
    console.error("Humidity API error:", error);

    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
}
