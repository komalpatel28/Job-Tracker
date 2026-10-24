const COLUMNS = ["Applied", "Interview", "Offer", "Rejected"];
const COUNTRIES = ["Canada", "Switzerland", "UAE/KSA", "South Korea", "India"];

const form = document.getElementById("job-form");
const board = document.getElementById("board");
const countEl = document.getElementById("count");
const searchEl = document.getElementById("search");
const filterEl = document.getElementById("filter");
const countryEl = document.getElementById("country");

let jobs = loadJobs();

function loadJobs() {
  try {
    return JSON.parse(localStorage.getItem("jobs")) || [];
  } catch {
    return [];
  }
}

function saveJobs() {
  try {
    localStorage.setItem("jobs", JSON.stringify(jobs));
  } catch {}
}

function fillCountries() {
  COUNTRIES.forEach((c) => countryEl.add(new Option(c, c)));
  filterEl.add(new Option("All countries", "All"));
  COUNTRIES.forEach((c) => filterEl.add(new Option(c, c)));
}

function addJob(data) {
  jobs.unshift({
    id: Date.now(),
    ...data,
    status: "Applied",
    date: new Date().toLocaleDateString(),
  });
  saveJobs();
  render();
}

function moveJob(id, status) {
  const job = jobs.find((j) => j.id === id);
  if (!job || job.status === status) return;
  job.status = status;
  saveJobs();
  render();
}

function deleteJob(id) {
  jobs = jobs.filter((j) => j.id !== id);
  saveJobs();
  render();
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function safeUrl(url) {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:" ? u.href : null;
  } catch {
    return null;
  }
}

function createCard(job) {
  const card = el("div", "card");
  card.draggable = true;

  card.addEventListener("dragstart", (e) => {
    e.dataTransfer.setData("text/plain", String(job.id));
    e.dataTransfer.effectAllowed = "move";
    card.classList.add("dragging");
  });
  card.addEventListener("dragend", () => card.classList.remove("dragging"));

  card.append(
    el("p", "company", job.company),
    el("p", "role", job.role),
    el("p", "meta", `${job.country} • ${job.date}`)
  );

  if (job.notes) card.append(el("p", "notes", job.notes));

  const href = job.link && safeUrl(job.link);
  if (href) {
    const a = el("a", "", "Open job posting");
    a.href = href;
    a.target = "_blank";
    a.rel = "noreferrer";
    card.append(a);
  }

  const actions = el("div", "actions");
  const select = el("select");
  select.setAttribute("aria-label", "Move job to column");
  COLUMNS.forEach((c) => select.add(new Option(c, c, false, c === job.status)));
  select.addEventListener("change", () => moveJob(job.id, select.value));

  const del = el("button", "delete", "Delete");
  del.type = "button";
  del.addEventListener("click", () => deleteJob(job.id));

  actions.append(select, del);
  card.append(actions);
  return card;
}

function createColumn(name, list) {
  const col = el("div", `column col-${name}`);
  const title = el("h2", "", name + " ");
  title.append(el("span", "", `(${list.length})`));

  const zone = el("div", "dropzone");
  zone.addEventListener("dragover", (e) => {
    e.preventDefault();
    zone.classList.add("drag-over");
  });
  zone.addEventListener("dragleave", () => zone.classList.remove("drag-over"));
  zone.addEventListener("drop", (e) => {
    e.preventDefault();
    zone.classList.remove("drag-over");
    moveJob(Number(e.dataTransfer.getData("text/plain")), name);
  });

  list.forEach((job) => zone.append(createCard(job)));
  col.append(title, zone);
  return col;
}

function render() {
  const query = searchEl.value.trim().toLowerCase();
  const country = filterEl.value;

  const visible = jobs.filter(
    (j) =>
      (country === "All" || j.country === country) &&
      (!query ||
        j.company.toLowerCase().includes(query) ||
        j.role.toLowerCase().includes(query))
  );

  board.replaceChildren(
    ...COLUMNS.map((name) =>
      createColumn(name, visible.filter((j) => j.status === name))
    )
  );

  countEl.textContent = `${jobs.length} application${jobs.length === 1 ? "" : "s"} tracked • data saved in your browser`;
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  addJob({
    company: form.company.value.trim(),
    role: form.role.value.trim(),
    country: form.country.value,
    link: form.link.value.trim(),
    notes: form.notes.value.trim(),
  });
  const keep = form.country.value;
  form.reset();
  form.country.value = keep;
});

searchEl.addEventListener("input", render);
filterEl.addEventListener("change", render);

fillCountries();
render();