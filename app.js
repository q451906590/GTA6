const checklistItems = [
  "完成教学任务并解锁基础武器商店",
  "购入第一把中距离主战武器",
  "完成 2 个低风险支线任务积累资金",
  "解锁改车点并完成一次基础改装",
  "熟悉 2 条警力规避路线",
  "建立“任务 + 改装 + 出售”刷钱循环",
];

const missions = [
  {
    id: 1,
    title: "霓虹初夜",
    type: "main",
    reward: "解锁主线分支与枪械商店",
    summary: "进入 Vice City 核心区，完成首次情报接头。",
    tips: "优先走屋顶连线躲开主干道巡逻，减少开局通缉风险。",
  },
  {
    id: 2,
    title: "潮汐快运",
    type: "side",
    reward: "现金 + 改装券",
    summary: "护送货车穿越沿海公路，途中会遭遇拦截。",
    tips: "提前准备高机动副车，遭遇封路时直接切换路线更稳。",
  },
  {
    id: 3,
    title: "午夜账本",
    type: "heist",
    reward: "高额现金 + 黑市声望",
    summary: "潜入会计楼层盗取账本并安全撤离。",
    tips: "建议携带消音武器，优先关闭监控再进入主服务器区域。",
  },
  {
    id: 4,
    title: "湿地信号",
    type: "main",
    reward: "解锁新地图区域",
    summary: "在沼泽地追踪失联发射器并夺回数据。",
    tips: "沼泽地机动差，使用轻型越野车并避免夜间长时间停留。",
  },
  {
    id: 5,
    title: "街角交易",
    type: "side",
    reward: "稳定日常收益来源",
    summary: "帮助本地联系人建立补给路线。",
    tips: "先清理交易点附近巡逻，再快速完成多点交付。",
  },
  {
    id: 6,
    title: "港口破晓",
    type: "heist",
    reward: "稀有载具改装配件",
    summary: "与队友配合夺取港口集装箱中的核心物资。",
    tips: "先处理制高点狙击位，再推进仓库主入口。",
  },
  {
    id: 7,
    title: "白线追逐",
    type: "main",
    reward: "解锁高级任务链",
    summary: "追捕关键线人并在限定时间内完成审讯。",
    tips: "先封堵桥口再追击，能显著降低任务失败概率。",
  },
  {
    id: 8,
    title: "暗巷赌局",
    type: "side",
    reward: "中额现金 + 联系人好感",
    summary: "调查地下赌局并找出作弊团伙。",
    tips: "谈判失败会触发巷战，准备高射速武器应急。",
  },
  {
    id: 9,
    title: "海岸线断电",
    type: "heist",
    reward: "高额现金 + 热度清除道具",
    summary: "切断沿海供电系统，掩护后续抢劫行动。",
    tips: "使用分段撤离方案，避免所有队友挤同一路线。",
  },
];

const checklistEl = document.getElementById("checklist");
const progressFillEl = document.getElementById("progressFill");
const progressTextEl = document.getElementById("progressText");
const missionGridEl = document.getElementById("missionGrid");
const missionSearchEl = document.getElementById("missionSearch");
const tabs = document.querySelectorAll(".tab");

const modal = document.getElementById("missionModal");
const modalTitleEl = document.getElementById("modalTitle");
const modalTypeEl = document.getElementById("modalType");
const modalRewardEl = document.getElementById("modalReward");
const modalTipsEl = document.getElementById("modalTips");
const closeModalEls = document.querySelectorAll("[data-close-modal]");

const CHECKLIST_STORAGE_KEY = "gta6-guide-checklist";

let selectedFilter = "all";
let searchQuery = "";
let checklistState = loadChecklistState();

renderChecklist();
renderMissions();

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    selectedFilter = tab.dataset.filter || "all";
    tabs.forEach((item) => item.classList.remove("is-active"));
    tab.classList.add("is-active");
    renderMissions();
  });
});

missionSearchEl.addEventListener("input", (event) => {
  searchQuery = event.target.value.trim().toLowerCase();
  renderMissions();
});

closeModalEls.forEach((button) => {
  button.addEventListener("click", closeMissionModal);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeMissionModal();
  }
});

function renderChecklist() {
  checklistEl.innerHTML = "";

  checklistItems.forEach((item, index) => {
    const listItem = document.createElement("li");
    const label = document.createElement("label");
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = Boolean(checklistState[index]);
    input.addEventListener("change", () => {
      checklistState[index] = input.checked;
      saveChecklistState(checklistState);
      updateChecklistProgress();
    });

    const text = document.createElement("span");
    text.textContent = item;

    label.append(input, text);
    listItem.appendChild(label);
    checklistEl.appendChild(listItem);
  });

  updateChecklistProgress();
}

function updateChecklistProgress() {
  const completedCount = checklistState.filter(Boolean).length;
  const totalCount = checklistItems.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  progressFillEl.style.width = `${progress}%`;
  progressTextEl.textContent = `${completedCount} / ${totalCount}`;
}

function renderMissions() {
  missionGridEl.innerHTML = "";

  const filteredMissions = missions.filter((mission) => {
    const matchesType = selectedFilter === "all" || mission.type === selectedFilter;
    if (!matchesType) return false;

    if (!searchQuery) return true;

    const text = `${mission.title} ${mission.reward} ${mission.summary} ${mission.tips}`.toLowerCase();
    return text.includes(searchQuery);
  });

  if (filteredMissions.length === 0) {
    const empty = document.createElement("div");
    empty.className = "mission-empty";
    empty.textContent = "没有匹配项，换个关键词试试。";
    missionGridEl.appendChild(empty);
    return;
  }

  filteredMissions.forEach((mission) => {
    const card = document.createElement("article");
    card.className = "mission-card";

    const typeTag = document.createElement("span");
    typeTag.className = `mission-type ${mission.type}`;
    typeTag.textContent = typeLabel(mission.type);

    const title = document.createElement("h3");
    title.textContent = mission.title;

    const reward = document.createElement("p");
    reward.textContent = `奖励：${mission.reward}`;

    const summary = document.createElement("p");
    summary.textContent = mission.summary;

    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "查看打法要点";
    button.addEventListener("click", () => openMissionModal(mission));

    card.append(typeTag, title, reward, summary, button);
    missionGridEl.appendChild(card);
  });
}

function typeLabel(type) {
  if (type === "main") return "主线";
  if (type === "side") return "支线";
  if (type === "heist") return "抢劫";
  return "未知";
}

function openMissionModal(mission) {
  modalTitleEl.textContent = mission.title;
  modalTypeEl.textContent = `类型：${typeLabel(mission.type)}`;
  modalRewardEl.textContent = `奖励：${mission.reward}`;
  modalTipsEl.textContent = `攻略要点：${mission.tips}`;
  modal.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeMissionModal() {
  if (modal.hidden) return;
  modal.hidden = true;
  document.body.style.overflow = "";
}

function loadChecklistState() {
  try {
    const raw = localStorage.getItem(CHECKLIST_STORAGE_KEY);
    if (!raw) return new Array(checklistItems.length).fill(false);
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return new Array(checklistItems.length).fill(false);
    }
    return checklistItems.map((_, index) => Boolean(parsed[index]));
  } catch (error) {
    return new Array(checklistItems.length).fill(false);
  }
}

function saveChecklistState(state) {
  localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(state));
}
