// 核心配置：储备心率百分比分区标准
const zoneConfig = [
    {
        key: "D",
        name: "D 热身/恢复区",
        type: "热身/恢复",
        shortLabel: "D 热身/恢复",
        color: "#e8f5e9",
        width: 170,
        hrrMin: 0,    hrrMax: 59,
        rq: "0.72 ~ 0.76",
        fat: "75% ~ 85%", cho: "15% ~ 25%",
        use: "赛前热身、赛后恢复、散步拉伸，脂肪供能占比最高"
    },
    {
        key: "E",
        name: "E 轻松跑区",
        type: "轻松跑区间",
        shortLabel: "E 轻松跑",
        color: "#c8e6c9",
        width: 210,
        hrrMin: 59,   hrrMax: 74,
        rq: "0.77 ~ 0.82",
        fat: "58% ~ 74%", cho: "26% ~ 42%",
        use: "长距离慢跑LSD、有氧打底、高效减脂，基础有氧核心区间"
    },
    {
        key: "M",
        name: "M 马拉松配速区",
        type: "马拉松配速区间",
        shortLabel: "M 马拉松配速",
        color: "#fff9c4",
        width: 190,
        hrrMin: 74,   hrrMax: 84,
        rq: "0.83 ~ 0.87",
        fat: "42% ~ 57%", cho: "43% ~ 58%",
        use: "马拉松比赛配速训练、长距离耐力，糖脂混合供能"
    },
    {
        key: "T",
        name: "T 乳酸阈值区",
        type: "乳酸阈值区间",
        shortLabel: "T 乳酸阈值",
        color: "#ffe0b2",
        width: 160,
        hrrMin: 84,   hrrMax: 88,
        rq: "0.88 ~ 0.92",
        fat: "25% ~ 41%", cho: "59% ~ 75%",
        use: "节奏跑、提升乳酸阈值，延长高强度续航"
    },
    {
        key: "A",
        name: "A 无氧耐力区",
        type: "无氧耐力区间",
        shortLabel: "A 无氧耐力",
        color: "#ffccbc",
        width: 130,
        hrrMin: 88,   hrrMax: 95,
        rq: "0.93 ~ 0.97",
        fat: "8% ~ 24%",  cho: "76% ~ 92%",
        use: "无氧耐力训练、提升最大摄氧量，糖原开始主导供能"
    },
    {
        key: "I",
        name: "I 最大摄氧/间歇区",
        type: "最大摄氧区间",
        shortLabel: "I 最大摄氧/间歇",
        color: "#ffcdd2",
        width: 260,
        hrrMin: 95,   hrrMax: 100,
        rq: "0.98 ~ 1.05",
        fat: "< 8%",      cho: "> 92%",
        use: "高强度间歇、冲刺训练，几乎仅消耗糖原，不燃脂"
    }
];

// 缓存常用 DOM 引用，避免重复查询
const gid = (id) => document.getElementById(id);
const els = {
    restHR: gid('restHR'), age: gid('age'), maxHrFormula: gid('maxHrFormula'), maxHR: gid('maxHR'),
    formulaHint: gid('formulaHint'), errorMsg: gid('errorMsg'), maxHrSource: gid('maxHrSource'),
    shareStatus: gid('shareStatus'), restText: gid('restText'), maxText: gid('maxText'),
    zoneLayers: gid('zoneLayers'), energyMarkers: gid('energyMarkers'),
    zoneDetailCard: gid('zoneDetailCard'), zoneDetailBadge: gid('zoneDetailBadge'),
    zoneDetailTitle: gid('zoneDetailTitle'), zoneDetailGrid: gid('zoneDetailGrid'),
    zoneDetailUse: gid('zoneDetailUse'), tableBody: gid('tableBody'), zoneMobileList: gid('zoneMobileList'),
    calcBtn: gid('calcBtn'), copyLinkBtn: gid('copyLinkBtn')
};

let activeZoneKey = zoneConfig[0].key;
let currentZoneList = [];
let isSyncingFromUrl = false;
let shareSeq = 0;
let hrNodes = [];
let rqNodes = [];

function debounce(fn, wait) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), wait);
    };
}

function getZoneLayout() {
    let currentX = 40;
    return zoneConfig.map(zone => {
        const layout = {
            ...zone,
            x: currentX,
            centerX: currentX + zone.width / 2
        };
        currentX += zone.width;
        return layout;
    });
}

function renderZoneSvgSkeleton() {
    const zoneLayout = getZoneLayout();

    els.zoneLayers.innerHTML = zoneLayout.map((zone, idx) => `
        <g data-zone-key="${zone.key}">
            <rect class="zone-block" data-zone-key="${zone.key}" tabindex="0" role="button" aria-label="查看 ${zone.name} 详情" x="${zone.x}" y="20" width="${zone.width}" height="45" rx="8" fill="${zone.color}" stroke="#d8cdbc"></rect>
            <text x="${zone.centerX}" y="48" text-anchor="middle" font-size="16" font-weight="600" fill="#3e3730" pointer-events="none">${zone.shortLabel}</text>
            <text id="hr${idx}" x="${zone.centerX}" y="82" text-anchor="middle" font-size="14" fill="#4a4239" pointer-events="none"></text>
            <text id="rq${idx}" x="${zone.centerX}" y="108" text-anchor="middle" font-size="13" fill="#b0573b" font-weight="bold" pointer-events="none"></text>
        </g>
    `).join('');

    renderEnergyMarkers(zoneLayout);

    hrNodes = zoneConfig.map((_, idx) => gid(`hr${idx}`));
    rqNodes = zoneConfig.map((_, idx) => gid(`rq${idx}`));
}

function renderEnergyMarkers(zoneLayout) {
    const markerTop = 226;
    const markerBottom = 238;
    const labelY = 252;

    els.energyMarkers.innerHTML = zoneLayout.map((zone, idx) => {
        const boundaryLine = idx < zoneLayout.length - 1
            ? `<line x1="${zone.x + zone.width}" y1="205" x2="${zone.x + zone.width}" y2="223" stroke="#ffffff" stroke-width="1" opacity="0.55"></line>`
            : '';

        return `
            <g data-marker-key="${zone.key}">
                <line x1="${zone.centerX}" y1="${markerTop}" x2="${zone.centerX}" y2="${markerBottom}" stroke="#a99d8c" stroke-width="1.2" opacity="0.7"></line>
                <circle class="zone-marker-hit" data-zone-key="${zone.key}" cx="${zone.centerX}" cy="${markerTop + 6}" r="12" fill="transparent"></circle>
                <text class="zone-marker-label" data-zone-key="${zone.key}" x="${zone.centerX}" y="${labelY}" text-anchor="middle" font-size="11" fill="#857a6c">${zone.key}</text>
                ${boundaryLine}
            </g>
        `;
    }).join('');
}

function setZoneVisualState(activeKey, hoverKey) {
    const activeOrHoverKey = hoverKey || activeKey;

    document.querySelectorAll('.zone-block').forEach(block => {
        const key = block.getAttribute('data-zone-key');
        if (key === activeOrHoverKey) {
            block.setAttribute('stroke', '#b0573b');
            block.setAttribute('stroke-width', '2.5');
            block.setAttribute('opacity', '1');
        } else {
            block.setAttribute('stroke', '#d8cdbc');
            block.setAttribute('stroke-width', '1');
            block.setAttribute('opacity', hoverKey ? '0.78' : '1');
        }
    });

    document.querySelectorAll('.zone-marker-label').forEach(label => {
        const key = label.getAttribute('data-zone-key');
        if (key === activeOrHoverKey) {
            label.setAttribute('font-size', '13');
            label.setAttribute('font-weight', '700');
            label.setAttribute('fill', '#3e3730');
        } else {
            label.setAttribute('font-size', '11');
            label.setAttribute('font-weight', '400');
            label.setAttribute('fill', hoverKey ? '#a99d8c' : '#857a6c');
        }
    });
}

function renderZoneDetail(zone) {
    if (!zone) {
        return;
    }

    els.zoneDetailCard.style.borderTopColor = zone.color;
    els.zoneDetailBadge.style.backgroundColor = zone.color;
    els.zoneDetailBadge.textContent = zone.key;
    els.zoneDetailTitle.textContent = `${zone.name} (${zone.type})`;
    els.zoneDetailGrid.innerHTML = `
        <div class="zone-detail-item"><strong>储备心率占比</strong>${zone.hrrRange}</div>
        <div class="zone-detail-item"><strong>心率范围</strong>${zone.startHR} - ${zone.endHR} 次/分</div>
        <div class="zone-detail-item"><strong>参考 RQ</strong>${zone.rq}</div>
        <div class="zone-detail-item"><strong>典型供能倾向</strong>${zone.fat} / ${zone.cho}</div>
    `;
    els.zoneDetailUse.innerHTML = `<strong>训练用途：</strong>${zone.use}`;
}

function syncActiveTableRow(zoneKey) {
    els.tableBody.querySelectorAll('tr').forEach(row => {
        row.classList.toggle('is-active-row', row.getAttribute('data-zone-key') === zoneKey);
    });
}

function syncActiveMobileItem(zoneKey) {
    els.zoneMobileList.querySelectorAll('.zone-mobile-item').forEach(item => {
        item.classList.toggle('is-active', item.getAttribute('data-zone-key') === zoneKey);
    });
}

function setActiveZone(zoneKey) {
    const matchedZone = currentZoneList.find(zone => zone.key === zoneKey);
    if (!matchedZone) {
        return;
    }

    activeZoneKey = zoneKey;
    setZoneVisualState(activeZoneKey);
    renderZoneDetail(matchedZone);
    syncActiveTableRow(activeZoneKey);
    syncActiveMobileItem(activeZoneKey);
    updateUrlState();
}

function focusZoneBlock(zoneKey) {
    const block = document.querySelector(`.zone-block[data-zone-key="${zoneKey}"]`);
    if (block && typeof block.focus === 'function') {
        block.focus();
    }
}

function bindZoneInteractions() {
    document.querySelectorAll('.zone-block, .zone-marker-hit, .zone-marker-label').forEach(node => {
        const key = node.getAttribute('data-zone-key');
        node.addEventListener('click', () => setActiveZone(key));
        node.addEventListener('mouseenter', () => setZoneVisualState(activeZoneKey, key));
        node.addEventListener('mouseleave', () => setZoneVisualState(activeZoneKey));
    });

    // 键盘可达性：区块支持 Enter/Space 激活、方向键在区间间切换
    document.querySelectorAll('.zone-block').forEach(block => {
        block.addEventListener('keydown', (e) => {
            const key = block.getAttribute('data-zone-key');
            const idx = zoneConfig.findIndex(z => z.key === key);
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setActiveZone(key);
            } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault();
                const nextKey = zoneConfig[Math.min(idx + 1, zoneConfig.length - 1)].key;
                setActiveZone(nextKey);
                focusZoneBlock(nextKey);
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault();
                const prevKey = zoneConfig[Math.max(idx - 1, 0)].key;
                setActiveZone(prevKey);
                focusZoneBlock(prevKey);
            }
        });
    });
}

function getEstimatedMaxHr(age, formula) {
    if (formula === 'tanaka') {
        return Math.round(208 - 0.7 * age);
    }
    return 220 - age;
}

function getFormulaLabel(formula) {
    return formula === 'tanaka' ? '208 - 0.7 x 年龄' : '220 - 年龄';
}

function updateUrlState() {
    if (isSyncingFromUrl) {
        return;
    }

    const params = new URLSearchParams();
    const restHR = els.restHR.value.trim();
    const age = els.age.value.trim();
    const formula = els.maxHrFormula.value;
    const maxHR = els.maxHR.value.trim();

    if (restHR) params.set('restHR', restHR);
    if (age) params.set('age', age);
    if (formula) params.set('formula', formula);
    if (maxHR) params.set('maxHR', maxHR);
    if (activeZoneKey) params.set('zone', activeZoneKey);

    const query = params.toString();
    const basePath = `${window.location.origin === 'null' ? '' : window.location.origin}${window.location.pathname}`;
    window.history.replaceState(null, '', `${basePath}${query ? `?${query}` : ''}`);
}

function loadStateFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const restHR = params.get('restHR');
    const age = params.get('age');
    const formula = params.get('formula');
    const maxHR = params.get('maxHR');
    const zone = params.get('zone');
    const validFormulas = ['fox', 'tanaka'];
    const validZones = zoneConfig.map(item => item.key);

    isSyncingFromUrl = true;

    if (restHR !== null && /^\d+$/.test(restHR)) {
        els.restHR.value = restHR;
    }
    if (age !== null && /^\d+$/.test(age)) {
        els.age.value = age;
    }
    if (validFormulas.includes(formula)) {
        els.maxHrFormula.value = formula;
    }
    if (maxHR !== null && /^\d+$/.test(maxHR)) {
        els.maxHR.value = maxHR;
    }
    if (validZones.includes(zone)) {
        activeZoneKey = zone;
    }

    isSyncingFromUrl = false;
}

async function copyShareLink() {
    const shareUrl = window.location.href;
    let message;

    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(shareUrl);
        } else {
            const tempInput = document.createElement('input');
            tempInput.value = shareUrl;
            document.body.appendChild(tempInput);
            tempInput.select();
            document.execCommand('copy');
            document.body.removeChild(tempInput);
        }
        message = '分享链接已复制';
    } catch (error) {
        message = '复制失败，请手动复制地址栏链接';
    }

    els.shareStatus.textContent = message;
    const seq = ++shareSeq;
    window.setTimeout(() => {
        if (seq === shareSeq) {
            els.shareStatus.textContent = '';
        }
    }, 2500);
}

// 主计算函数
function calcHRZone() {
    const restHR = parseInt(els.restHR.value, 10);
    const age = parseInt(els.age.value, 10);
    const manualMaxHR = parseInt(els.maxHR.value, 10);
    const formula = els.maxHrFormula.value;

    els.formulaHint.textContent = `当前估算公式：${getFormulaLabel(formula)}。若有实测值，建议优先填写实测最大心率。`;
    [els.restHR, els.age, els.maxHR].forEach(input => input.classList.remove('invalid'));

    let maxHR;
    let maxSourceText = '';

    function showError(message, input) {
        els.errorMsg.textContent = message;
        els.errorMsg.style.display = 'block';
        els.maxHrSource.textContent = '';
        if (input) {
            input.classList.add('invalid');
        }
    }

    // 输入校验
    if (!restHR || restHR < 40 || restHR > 100) {
        showError('请填写合法静息心率（40 ~ 100 次/分）', els.restHR);
        return;
    }

    // 计算最大心率：优先使用手动输入，无则按选定公式估算
    if (Number.isInteger(manualMaxHR) && manualMaxHR >= 120 && manualMaxHR <= 220) {
        maxHR = manualMaxHR;
        maxSourceText = `当前最大心率采用实测输入值：${maxHR} 次/分`;
    } else {
        if (!age || age < 10 || age > 100) {
            showError('请填写年龄，或输入合法实测最大心率（120 ~ 220 次/分）', !age ? els.age : els.maxHR);
            return;
        }
        maxHR = getEstimatedMaxHr(age, formula);
        maxSourceText = `当前最大心率采用年龄估算值：${maxHR} 次/分（${getFormulaLabel(formula)}，年龄 ${age}）`;
    }

    if (maxHR <= restHR) {
        showError('最大心率不能小于或等于静息心率，请检查输入', els.maxHR.value ? els.maxHR : els.restHR);
        return;
    }

    els.errorMsg.style.display = 'none';
    els.maxHrSource.textContent = maxSourceText;

    // 核心公式：储备心率 HRR = 最大心率 - 静息心率（Karvonen）
    const hrr = maxHR - restHR;

    // 计算每个区间的实际心率上下限，使用连续不重叠的显示规则
    let prevEndHR = null;
    currentZoneList = zoneConfig.map((item, idx) => {
        const isFirst = idx === 0;
        const isLast = idx === zoneConfig.length - 1;
        const rawEnd = restHR + hrr * item.hrrMax / 100;
        const startHR = isFirst ? Math.round(restHR + hrr * item.hrrMin / 100) : prevEndHR + 1;
        let endHR = isLast ? Math.round(rawEnd) : Math.floor(rawEnd);
        if (endHR < startHR) {
            endHR = startHR;
        }
        prevEndHR = endHR;
        const displayMin = isFirst ? item.hrrMin : zoneConfig[idx - 1].hrrMax + 1;

        return {
            ...item,
            startHR,
            endHR,
            hrrRange: `${displayMin}% - ${item.hrrMax}%`
        };
    });

    if (!currentZoneList.some(zone => zone.key === activeZoneKey)) {
        activeZoneKey = currentZoneList[0].key;
    }

    // 更新SVG图形动态数值
    els.restText.textContent = restHR;
    els.maxText.textContent = maxHR;

    currentZoneList.forEach((zone, idx) => {
        hrNodes[idx].textContent = `${zone.startHR} ~ ${zone.endHR} 次/分`;
        rqNodes[idx].textContent = `RQ：${zone.rq}`;
    });

    // 更新下方明细表格（事件委托处理点击/键盘；行底色用 CSSOM 设置，避免内联 style 触发 CSP）
    els.tableBody.innerHTML = currentZoneList.map(zone => `
        <tr data-zone-key="${zone.key}" tabindex="0" role="button" aria-label="查看 ${zone.name} 详情">
            <td data-label="训练区间">${zone.name}</td>
            <td data-label="运动强度区">${zone.type}</td>
            <td data-label="储备心率占比">${zone.hrrRange}</td>
            <td data-label="心率范围">${zone.startHR} - ${zone.endHR}</td>
            <td data-label="参考 RQ">${zone.rq}</td>
            <td data-label="供能倾向(脂肪/碳水)">${zone.fat} / ${zone.cho}</td>
            <td data-label="训练用途">${zone.use}</td>
        </tr>
    `).join('');
    els.tableBody.querySelectorAll('tr').forEach((row, idx) => {
        row.style.backgroundColor = currentZoneList[idx].color;
    });

    // 更新移动端区间卡片列表（窄屏使用）
    els.zoneMobileList.innerHTML = currentZoneList.map(zone => `
        <button type="button" class="zone-mobile-item" data-zone-key="${zone.key}" aria-label="查看 ${zone.name} 详情">
            <span class="zmi-badge">${zone.key}</span>
            <span class="zmi-main">
                <span class="zmi-name">${zone.name}</span>
                <span class="zmi-sub">${zone.startHR}–${zone.endHR} 次/分 · RQ ${zone.rq}</span>
            </span>
        </button>
    `).join('');
    els.zoneMobileList.querySelectorAll('.zone-mobile-item').forEach((item, idx) => {
        item.querySelector('.zmi-badge').style.backgroundColor = currentZoneList[idx].color;
    });

    setActiveZone(activeZoneKey);
}

// 初始化
renderZoneSvgSkeleton();
bindZoneInteractions();
loadStateFromUrl();

const debouncedCalc = debounce(calcHRZone, 180);
els.calcBtn.addEventListener('click', calcHRZone);
els.copyLinkBtn.addEventListener('click', copyShareLink);
['restHR', 'age', 'maxHR', 'maxHrFormula'].forEach(id => {
    els[id].addEventListener('input', debouncedCalc);
});

// 表格交互：事件委托（点击 + Enter/Space 键盘激活）
els.tableBody.addEventListener('click', (e) => {
    const tr = e.target.closest('tr[data-zone-key]');
    if (tr) {
        setActiveZone(tr.getAttribute('data-zone-key'));
    }
});
els.tableBody.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
        const tr = e.target.closest('tr[data-zone-key]');
        if (tr) {
            e.preventDefault();
            setActiveZone(tr.getAttribute('data-zone-key'));
        }
    }
});

// 移动端卡片交互：事件委托（button 原生支持键盘激活）
els.zoneMobileList.addEventListener('click', (e) => {
    const item = e.target.closest('.zone-mobile-item');
    if (item) {
        setActiveZone(item.getAttribute('data-zone-key'));
    }
});

calcHRZone();
