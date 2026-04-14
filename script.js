let currentRange = "24h";

// ---------- NAV ----------
const navButtons = document.querySelectorAll(".nav-btn");
const screens = {
  models: document.getElementById("screen-models"),
  devices: document.getElementById("screen-devices"),
  humidity: document.getElementById("screen-humidity"),
  account: document.getElementById("screen-account"),
};

function setActiveScreen(target) {
  Object.values(screens).forEach((screen) => {
    if (screen) screen.classList.remove("active");
  });

  navButtons.forEach((btn) => btn.classList.remove("active"));

  if (screens[target]) {
    screens[target].classList.add("active");
  }

  const activeButton = document.querySelector(`.nav-btn[data-target="${target}"]`);
  if (activeButton) {
    activeButton.classList.add("active");
  }
}

navButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const target = button.dataset.target;
    setActiveScreen(target);
  });
});

// ---------- DOM ----------
const humiditySentenceEl = document.getElementById("humiditySentence");
const orbValueEl = document.getElementById("orbValue");
const humidityStatusEl = document.getElementById("humidityStatus");
const lastUpdatedEl = document.getElementById("lastUpdated");
const roomMoodTextEl = document.getElementById("roomMoodText");
const moodSwingsTextEl = document.getElementById("moodSwingsText");
const recommendationTitleEl = document.getElementById("recommendationTitle");
const recommendationTextEl = document.getElementById("recommendationText");
const recommendationPillEl = document.getElementById("recommendationPill");

const avgValueEl = document.getElementById("avgValue");
const highValueEl = document.getElementById("highValue");
const lowValueEl = document.getElementById("lowValue");
const riskHoursValueEl = document.getElementById("riskHoursValue");

const miniTag1El = document.getElementById("miniTag1");
const miniTag2El = document.getElementById("miniTag2");
const miniTag3El = document.getElementById("miniTag3");

const actionItem1El = document.getElementById("actionItem1");
const actionItem2El = document.getElementById("actionItem2");
const actionItem3El = document.getElementById("actionItem3");
const actionItem4El = document.getElementById("actionItem4");

const rangeButtons = document.querySelectorAll(".range-switch button");

const chartSvgEl = document.getElementById("chartSvg");
const chartLineEl = document.getElementById("chartLine");
const chartPointsEl = document.getElementById("chartPoints");
const chartLabelsEl = document.getElementById("chartLabels");
const chartEmptyStateEl = document.getElementById("chartEmptyState");
const chartTooltipEl = document.getElementById("chartTooltip");

const root = document.documentElement;

// ---------- HELPERS ----------
function formatTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString("en-CA", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "America/Toronto",
  });
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function setStateColor(color) {
  root.style.setProperty("--state-color", color);
  root.style.setProperty("--fill-percent", `${clamp(Number(orbValueEl?.textContent?.replace("%", "") || 0), 0, 100)}%`);
}

function resetStatusClasses(el) {
  if (!el) return;
  el.classList.remove("good", "warn", "bad");
}

// ---------- THEME / CONTENT ----------
function setThemeByHumidity(humidity) {
  root.style.setProperty("--fill-percent", `${clamp(humidity, 0, 100)}%`);

  resetStatusClasses(humidityStatusEl);
  resetStatusClasses(recommendationPillEl);

  if (humidity <= 40) {
    setStateColor("#59c57d");

    if (humidityStatusEl) {
      humidityStatusEl.textContent = "Pretty safe";
      humidityStatusEl.classList.add("good");
    }

    if (roomMoodTextEl) {
      roomMoodTextEl.textContent =
        "This is the kind of room humidity that most filament can live with pretty comfortably.";
    }

    if (moodSwingsTextEl) moodSwingsTextEl.textContent = "calm days.";

    if (recommendationTitleEl) {
      recommendationTitleEl.textContent =
        "This is a pretty comfortable range for most printing.";
    }

    if (recommendationTextEl) {
      recommendationTextEl.textContent =
        "PLA should be totally fine, and even more sensitive materials are in a much better place here than in a damp room.";
    }

    if (miniTag1El) miniTag1El.textContent = "PLA should be totally fine";
    if (miniTag2El) miniTag2El.textContent = "PETG is still comfortable";
    if (miniTag3El) miniTag3El.textContent = "Nylon still prefers dry storage";

    if (actionItem1El) actionItem1El.textContent = "Good time for a casual PLA print";
    if (actionItem2El) actionItem2El.textContent = "Store filament normally";
    if (actionItem3El) actionItem3El.textContent = "No urgent drying needed";
    if (actionItem4El) actionItem4El.textContent = "Check again before overnight jobs";

    if (recommendationPillEl) {
      recommendationPillEl.classList.add("good");
      recommendationPillEl.textContent = "Ideal conditions";
    }
  } else if (humidity <= 55) {
    setStateColor("#dfb958");

    if (humidityStatusEl) {
      humidityStatusEl.textContent = "Keep an eye on it";
      humidityStatusEl.classList.add("warn");
    }

    if (roomMoodTextEl) {
      roomMoodTextEl.textContent =
        "This is still workable, but this is where exposed filament can slowly start becoming less happy over time.";
    }

    if (moodSwingsTextEl) moodSwingsTextEl.textContent = "questionable days.";

    if (recommendationTitleEl) {
      recommendationTitleEl.textContent =
        "This is still usable, but storage matters more now.";
    }

    if (recommendationTextEl) {
      recommendationTextEl.textContent =
        "PLA is usually still okay, but PETG, TPU, and nylon are starting to become much more sensitive to being left out.";
    }

    if (miniTag1El) miniTag1El.textContent = "PLA is still usually okay";
    if (miniTag2El) miniTag2El.textContent = "PETG should be watched";
    if (miniTag3El) miniTag3El.textContent = "Nylon should stay sealed";

    if (actionItem1El) actionItem1El.textContent = "PLA is still usually okay";
    if (actionItem2El) actionItem2El.textContent = "Store exposed filament";
    if (actionItem3El) actionItem3El.textContent = "Dry PETG or nylon before long prints";
    if (actionItem4El) actionItem4El.textContent = "Monitor the room through the day";

    if (recommendationPillEl) {
      recommendationPillEl.classList.add("warn");
      recommendationPillEl.textContent = "Monitor conditions";
    }
  } else {
    setStateColor("#df6c67");

    if (humidityStatusEl) {
      humidityStatusEl.textContent = "Too humid";
      humidityStatusEl.classList.add("bad");
    }

    if (roomMoodTextEl) {
      roomMoodTextEl.textContent =
        "Yeah, this is the point where your filament starts developing trust issues.";
    }

    if (moodSwingsTextEl) moodSwingsTextEl.textContent = "risky spikes.";

    if (recommendationTitleEl) {
      recommendationTitleEl.textContent = "This is dry-box territory.";
    }

    if (recommendationTextEl) {
      recommendationTextEl.textContent =
        "At this point, long exposure is not doing your filament any favors. Drying and sealed storage are strongly recommended.";
    }

    if (miniTag1El) miniTag1El.textContent = "PLA should not stay out too long";
    if (miniTag2El) miniTag2El.textContent = "PETG should be stored now";
    if (miniTag3El) miniTag3El.textContent = "Nylon needs a dry box";

    if (actionItem1El) actionItem1El.textContent = "Avoid leaving filament exposed";
    if (actionItem2El) actionItem2El.textContent = "Store all active spools now";
    if (actionItem3El) actionItem3El.textContent = "Dry PETG, TPU, or nylon before printing";
    if (actionItem4El) actionItem4El.textContent = "Delay sensitive or long prints if possible";

    if (recommendationPillEl) {
      recommendationPillEl.classList.add("bad");
      recommendationPillEl.textContent = "High humidity warning";
    }
  }
}

function updateLatestUI(latest) {
  if (!latest || latest.humidity == null) {
    if (humiditySentenceEl) humiditySentenceEl.textContent = "--% humidity.";
    if (orbValueEl) orbValueEl.textContent = "--%";
    if (humidityStatusEl) humidityStatusEl.textContent = "No data yet";
    if (lastUpdatedEl) lastUpdatedEl.textContent = "Waiting for sensor data";
    return;
  }

  const humidity = Math.round(latest.humidity * 10) / 10;

  if (humiditySentenceEl) humiditySentenceEl.textContent = `${humidity}% humidity.`;
  if (orbValueEl) orbValueEl.textContent = `${humidity}%`;
  if (lastUpdatedEl) {
    lastUpdatedEl.textContent = `Last updated ${formatTime(latest.createdAt)}`;
  }

  setThemeByHumidity(humidity);
}

function updateSummaryUI(data) {
  if (avgValueEl) avgValueEl.textContent = `${data.avg ?? 0}%`;
  if (highValueEl) highValueEl.textContent = `${data.high ?? 0}%`;
  if (lowValueEl) lowValueEl.textContent = `${data.low ?? 0}%`;

  const riskHours = Number(data.riskHours ?? 0).toFixed(1);
  if (riskHoursValueEl) riskHoursValueEl.textContent = `${riskHours}h`;
}

// ---------- CHART ----------
function hideTooltip() {
  if (!chartTooltipEl) return;
  chartTooltipEl.classList.remove("show");
  chartTooltipEl.classList.add("hidden");
}

function clearChart() {
  if (chartSvgEl) chartSvgEl.classList.remove("empty");
  if (chartLineEl) chartLineEl.setAttribute("points", "");
  if (chartPointsEl) chartPointsEl.innerHTML = "";
  if (chartLabelsEl) chartLabelsEl.innerHTML = "";
  if (chartEmptyStateEl) chartEmptyStateEl.innerHTML = "";
  hideTooltip();
}

function showEmptyChartMessage(message) {
  if (!chartSvgEl || !chartEmptyStateEl) return;

  clearChart();
  chartSvgEl.classList.add("empty");

  const mainText = document.createElementNS("http://www.w3.org/2000/svg", "text");
  mainText.setAttribute("x", "170");
  mainText.setAttribute("y", "110");
  mainText.setAttribute("text-anchor", "middle");
  mainText.setAttribute("class", "chart-empty-text");
  mainText.textContent = message;

  const subText = document.createElementNS("http://www.w3.org/2000/svg", "text");
  subText.setAttribute("x", "170");
  subText.setAttribute("y", "132");
  subText.setAttribute("text-anchor", "middle");
  subText.setAttribute("class", "chart-empty-subtext");
  subText.textContent = "Let the sensor gather more readings.";

  chartEmptyStateEl.appendChild(mainText);
  chartEmptyStateEl.appendChild(subText);
}

function showTooltip(x, y, label, value) {
  if (!chartTooltipEl) return;
  chartTooltipEl.innerHTML = `<strong>${value}%</strong><br>${label}`;
  chartTooltipEl.style.left = `${x}px`;
  chartTooltipEl.style.top = `${y}px`;
  chartTooltipEl.classList.remove("hidden");
  chartTooltipEl.classList.add("show");
}

function buildChart(labels, series, range, uniqueDays = 0) {
  if (!chartSvgEl || !chartLineEl || !chartPointsEl || !chartLabelsEl) return;

  clearChart();

  const notEnoughForLongRange =
    (range === "week" && uniqueDays < 6) ||
    (range === "month" && uniqueDays < 29);

  if (
    !labels.length ||
    !series.length ||
    labels.length < 2 ||
    series.length < 2 ||
    notEnoughForLongRange
  ) {
    showEmptyChartMessage("Not enough history yet.");
    return;
  }

  const xMin = 24;
  const xMax = 316;
  const yMin = 28;
  const yMax = 188;

  const minVal = Math.min(...series, 20);
  const maxVal = Math.max(...series, 80);
  const safeMin = Math.floor(minVal - 5);
  const safeMax = Math.ceil(maxVal + 5);
  const valRange = Math.max(1, safeMax - safeMin);

  const points = series.map((value, index) => {
    const x =
      labels.length === 1
        ? (xMin + xMax) / 2
        : xMin + (index / (labels.length - 1)) * (xMax - xMin);

    const y = yMax - ((value - safeMin) / valRange) * (yMax - yMin);

    return { x, y, value, label: labels[index] };
  });

  chartLineEl.setAttribute(
    "points",
    points.map((p) => `${p.x},${p.y}`).join(" ")
  );

  const svgRect = chartSvgEl.getBoundingClientRect();

  points.forEach((p) => {
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", p.x);
    circle.setAttribute("cy", p.y);
    circle.setAttribute("r", "4.5");

    circle.addEventListener("mouseenter", () => {
      const relativeX = (p.x / 340) * svgRect.width;
      const relativeY = (p.y / 220) * svgRect.height;
      showTooltip(relativeX, relativeY, p.label, p.value);
    });

    circle.addEventListener("mouseleave", hideTooltip);

    chartPointsEl.appendChild(circle);
  });

  const maxLabels = 4;
  const step = Math.max(1, Math.ceil(labels.length / maxLabels));

  labels.forEach((label, index) => {
    if (index % step !== 0 && index !== labels.length - 1) return;

    const x =
      labels.length === 1
        ? (xMin + xMax) / 2
        : xMin + (index / (labels.length - 1)) * (xMax - xMin);

    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", x);
    text.setAttribute("y", "208");
    text.setAttribute("text-anchor", "middle");
    text.textContent = label;
    chartLabelsEl.appendChild(text);
  });
}

// ---------- FETCH ----------
async function fetchHumidity(range = "24h") {
  try {
    const res = await fetch(`/api/humidity?city=Sensor&range=${range}`);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Failed to fetch humidity");
    }

    updateLatestUI(data.latest);
    updateSummaryUI(data);

    try {
      buildChart(
        data.labels || [],
        data.series || [],
        range,
        data.uniqueDays || 0
      );
    } catch (chartError) {
      console.error("Chart build error:", chartError);
      showEmptyChartMessage("Chart could not load.");
    }
  } catch (error) {
    console.error("Humidity fetch error:", error);

    if (humidityStatusEl) {
      resetStatusClasses(humidityStatusEl);
      humidityStatusEl.classList.add("bad");
      humidityStatusEl.textContent = "Something broke";
    }

    if (lastUpdatedEl) {
      lastUpdatedEl.textContent = "Could not load sensor data";
    }

    showEmptyChartMessage("No data available.");
  }
}

// ---------- RANGE SWITCH ----------
rangeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    rangeButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");
    currentRange = button.dataset.range;
    fetchHumidity(currentRange);
  });
});

// ---------- INIT ----------
setActiveScreen("models");
fetchHumidity(currentRange);

setInterval(() => {
  fetchHumidity(currentRange);
}, 60000);