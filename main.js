const API_BASE = 'https://back-end2-production.up.railway.app';
const WHATSAPP_NUMBER = '201143348433';

const defaultBricks = [
    { id: '1', name: 'طوب أحمر مفرغ (مثقب)', price: 1200, size: '25×12×6 سم' },
    { id: '2', name: 'طوب أسمنتي مصمت', price: 1600, size: '25×12×6 سم' },
    { id: '3', name: 'طوب خفيف إيكولوجي', price: 2100, size: '60×20×20 سم' }
];

const defaultGovernorates = [
    { id: '1', name: 'القاهرة', freight: 300 },
    { id: '2', name: 'الجيزة', freight: 250 },
    { id: '3', name: 'القليوبية', freight: 350 },
    { id: '4', name: 'الإسكندرية', freight: 550 },
    { id: '5', name: 'البحيرة', freight: 500 },
    { id: '6', name: 'الفيوم', freight: 400 },
    { id: '7', name: 'الشرقية', freight: 400 },
    { id: '8', name: 'الدقهلية', freight: 450 },
    { id: '9', name: 'الغربية', freight: 420 },
    { id: '10', name: 'المنوفية', freight: 380 },
    { id: '11', name: 'دمياط', freight: 500 },
    { id: '12', name: 'بورسعيد', freight: 550 },
    { id: '13', name: 'الإسماعيلية', freight: 480 },
    { id: '14', name: 'السويس', freight: 500 },
    { id: '15', name: 'كفر الشيخ', freight: 460 },
    { id: '16', name: 'بني سويف', freight: 450 },
    { id: '17', name: 'المنيا', freight: 550 },
    { id: '18', name: 'أسيوط', freight: 650 },
    { id: '19', name: 'سوهاج', freight: 750 },
    { id: '20', name: 'قنا', freight: 850 },
    { id: '21', name: 'الأقصر', freight: 900 },
    { id: '22', name: 'أسوان', freight: 1000 },
    { id: '23', name: 'مطروح', freight: 800 },
    { id: '24', name: 'الوادي الجديد', freight: 950 },
    { id: '25', name: 'البحر الأحمر', freight: 850 },
    { id: '26', name: 'شمال سيناء', freight: 700 },
    { id: '27', name: 'جنوب سيناء', freight: 850 }
];

function getStoredData() {
    const bricks = localStorage.getItem('site_bricks');
    const govs = localStorage.getItem('site_govs');
    const orders = localStorage.getItem('site_orders');

    return {
        bricks: bricks ? JSON.parse(bricks) : defaultBricks,
        governorates: govs ? JSON.parse(govs) : defaultGovernorates,
        orders: orders ? JSON.parse(orders) : []
    };
}

function saveData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

function renderClientViews() {
    const data = getStoredData();
    const grid = document.getElementById('pricesDisplayGrid');
    const catalogGovBody = document.getElementById('catalogFreightTableBody');
    const typeSelect = document.getElementById('reqType');
    const govSelect = document.getElementById('reqGovernorate');

    if (!grid) return;

    grid.innerHTML = '';
    if (typeSelect) typeSelect.innerHTML = '';
    if (govSelect) govSelect.innerHTML = '';
    if (catalogGovBody) catalogGovBody.innerHTML = '';

    const defaultFreight = data.governorates.length > 0 ? data.governorates[0].freight : 0;

    data.bricks.forEach(brick => {
        grid.innerHTML += `
            <div class="brick-card">
                <h4>🧱 ${brick.name}</h4>
                <p>المقاس: <strong>${brick.size || 'غير محدد'}</strong></p>
                <div class="price-details-box">
                    <p>سعر الطوب (للألف): <span class="highlight-text">${Number(brick.price).toLocaleString()} ج.م</span></p>
                    <p>متوسط المشال والنقل: <span>${Number(defaultFreight).toLocaleString()} ج.م</span></p>
                </div>
                <div class="price-tag-big">الإجمالي التقديري: ${(Number(brick.price) + Number(defaultFreight)).toLocaleString()} ج.م</div>
            </div>
        `;
        if (typeSelect) {
            typeSelect.innerHTML += `<option value="${brick.id}">${brick.name}</option>`;
        }
    });

    data.governorates.forEach(gov => {
        if (govSelect) {
            govSelect.innerHTML += `<option value="${gov.id}">${gov.name} (مشال: ${gov.freight} ج.م)</option>`;
        }
        if (catalogGovBody) {
            catalogGovBody.innerHTML += `
                <tr>
                    <td><strong>📍 ${gov.name}</strong></td>
                    <td>${Number(gov.freight).toLocaleString()} ج.م</td>
                </tr>
            `;
        }
    });

    calculateOrderTotal();
}

function calculateOrderTotal() {
    const data = getStoredData();
    const typeId = document.getElementById('reqType')?.value;
    const qty = parseFloat(document.getElementById('reqQty')?.value) || 0;
    const govId = document.getElementById('reqGovernorate')?.value;

    const selectedBrick = data.bricks.find(b => b.id === typeId);
    const selectedGov = data.governorates.find(g => g.id === govId);

    const bPrice = selectedBrick ? selectedBrick.price : 0;
    const gFreight = selectedGov ? selectedGov.freight : 0;

    const total = (qty / 1000) * (parseFloat(bPrice) + parseFloat(gFreight));
    const targetInput = document.getElementById('estimatedPrice');
    
    if (targetInput) {
        targetInput.value = total.toLocaleString() + ' ج.م';
    }
}

function renderAdminPanel() {
    const data = getStoredData();
    const pContainer = document.getElementById('adminPriceControls');
    if (pContainer) {
        pContainer.innerHTML = '';
        data.bricks.forEach(b => {
            pContainer.innerHTML += `
                <div style="margin-bottom:12px; background: rgba(255,255,255,0.03); padding: 10px; border-radius: 6px;">
                    <label style="color:var(--accent); font-weight:bold;">🧱 ${b.name}</label>
                    <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top: 6px;">
                        <input type="number" id="price_${b.id}" value="${b.price}">
                        <input type="text" id="size_${b.id}" value="${b.size || ''}">
                        <button class="btn-submit" onclick="saveBrickData('${b.id}')">حفظ</button>
                        <button class="btn-submit btn-cancel" onclick="deleteBrick('${b.id}')">حذف</button>
                    </div>
                </div>`;
        });
    }

    const gBody = document.getElementById('adminFreightTableBody');
    if (gBody) {
        gBody.innerHTML = '';
        data.governorates.forEach(g => {
            gBody.innerHTML += `
                <tr>
                    <td>📍 ${g.name}</td>
                    <td><input type="number" id="gov_${g.id}" value="${g.freight}" style="width: 100px;"> ج.م</td>
                    <td>
                        <button class="btn-submit" onclick="saveGovData('${g.id}')">حفظ</button>
                        <button class="btn-submit btn-cancel" onclick="deleteGov('${g.id}')">حذف</button>
                    </td>
                </tr>
            `;
        });
    }

    const oBody = document.getElementById('adminOrdersTableBody');
    if (oBody) {
        oBody.innerHTML = '';
        data.orders.forEach(o => {
            oBody.innerHTML += `
                <tr>
                    <td>${o.name}</td>
                    <td>${o.phone}</td>
                    <td>${o.brickType} (${o.qty})</td>
                    <td>${o.governorate} - ${o.address}</td>
                    <td>${o.totalPrice}</td>
                    <td><button class="btn-submit btn-cancel" onclick="deleteOrder('${o.id}')">حذف</button></td>
                </tr>
            `;
        });
        const totalElem = document.getElementById('totalOrdersCount');
        if (totalElem) totalElem.innerText = data.orders.length;
    }
}

function saveBrickData(id) {
    const data = getStoredData();
    const price = document.getElementById(`price_${id}`).value;
    const size = document.getElementById(`size_${id}`).value;

    const brick = data.bricks.find(b => b.id === id);
    if (brick) {
        brick.price = parseFloat(price);
        brick.size = size;
        saveData('site_bricks', data.bricks);
        showToast('تم تحديث السعر والمقاس بنجاح');
        renderAdminPanel();
        renderClientViews();
    }
}

function deleteBrick(id) {
    if (!confirm('هل تريد حذف هذا النوع؟')) return;
    let data = getStoredData();
    data.bricks = data.bricks.filter(b => b.id !== id);
    saveData('site_bricks', data.bricks);
    showToast('تم الحذف');
    renderAdminPanel();
    renderClientViews();
}

function saveGovData(id) {
    const data = getStoredData();
    const freight = document.getElementById(`gov_${id}`).value;

    const gov = data.governorates.find(g => g.id === id);
    if (gov) {
        gov.freight = parseFloat(freight);
        saveData('site_govs', data.governorates);
        showToast('تم تحديث أسعار المشال');
        renderAdminPanel();
        renderClientViews();
    }
}

function deleteGov(id) {
    if (!confirm('هل تريد حذف المحافظة؟')) return;
    let data = getStoredData();
    data.governorates = data.governorates.filter(g => g.id !== id);
    saveData('site_govs', data.governorates);
    showToast('تم الحذف');
    renderAdminPanel();
    renderClientViews();
}

function deleteOrder(id) {
    let data = getStoredData();
    data.orders = data.orders.filter(o => o.id !== id);
    saveData('site_orders', data.orders);
    showToast('تم حذف الطلب');
    renderAdminPanel();
}

function showSection(sectionId, btn) {
    document.querySelectorAll('.portal-page').forEach(p => p.classList.remove('active-page'));
    document.querySelectorAll('#clientNav .nav-link').forEach(b => b.classList.remove('active'));
    document.getElementById(sectionId)?.classList.add('active-page');
    btn?.classList.add('active');
}

function showAdminTab(tabId, btn) {
    document.querySelectorAll('.admin-tab-content').forEach(t => t.classList.remove('active-tab'));
    document.querySelectorAll('#adminNav .nav-link').forEach(b => b.classList.remove('active'));
    document.getElementById(tabId)?.classList.add('active-tab');
    btn?.classList.add('active');
}

function openAdminModal() { document.getElementById('adminAuthModal').style.display = 'flex'; }
function closeAdminModal() { document.getElementById('adminAuthModal').style.display = 'none'; }

function showAdminDashboard() {
    closeAdminModal();
    document.getElementById('clientPortal').style.display = 'none';
    document.getElementById('clientNav').style.display = 'none';
    document.getElementById('adminPortal').style.display = 'block';
    document.getElementById('adminNav').style.display = 'flex';
    renderAdminPanel();
}

function logoutAdmin() {
    sessionStorage.removeItem('is_admin');
    document.getElementById('adminPortal').style.display = 'none';
    document.getElementById('adminNav').style.display = 'none';
    document.getElementById('clientPortal').style.display = 'block';
    document.getElementById('clientNav').style.display = 'flex';
    renderClientViews();
    showToast('تم الخروج من لوحة التحكم');
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `custom-toast ${type}`;
    toast.innerText = message;
    container.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 50);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 250);
    }, 2500);
}

document.addEventListener('DOMContentLoaded', () => {
    renderClientViews();

    if (sessionStorage.getItem('is_admin') === 'true') {
        showAdminDashboard();
    }

    document.getElementById('loginForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const u = document.getElementById('loginUsername').value;
        const p = document.getElementById('loginPassword').value;

        if (u === 'admin' && p === '123') {
            sessionStorage.setItem('is_admin', 'true');
            showAdminDashboard();
            showToast('تم الدخول بنجاح');
        } else {
            showToast('خطأ في بيانات الدخول', 'error');
        }
    });

    document.getElementById('addBrickForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const data = getStoredData();
        const name = document.getElementById('newBrickName').value;
        const price = parseFloat(document.getElementById('newBrickPrice').value);
        const size = document.getElementById('newBrickSize').value;

        data.bricks.push({ id: Date.now().toString(), name, price, size });
        saveData('site_bricks', data.bricks);
        showToast('تمت إضافة الطوب');
        e.target.reset();
        renderAdminPanel();
        renderClientViews();
    });

    document.getElementById('addGovForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const data = getStoredData();
        const name = document.getElementById('newGovName').value;
        const freight = parseFloat(document.getElementById('newGovFreight').value);

        data.governorates.push({ id: Date.now().toString(), name, freight });
        saveData('site_govs', data.governorates);
        showToast('تمت إضافة المحافظة');
        e.target.reset();
        renderAdminPanel();
        renderClientViews();
    });

    document.getElementById('clientOrderForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const data = getStoredData();
        const name = document.getElementById('reqName').value;
        const phone = document.getElementById('reqPhone').value;
        const typeSelect = document.getElementById('reqType');
        const brickType = typeSelect.options[typeSelect.selectedIndex].text;
        const qty = document.getElementById('reqQty').value;
        const govSelect = document.getElementById('reqGovernorate');
        const governorate = govSelect.options[govSelect.selectedIndex].text;
        const address = document.getElementById('reqAddress').value;
        const totalPrice = document.getElementById('estimatedPrice').value;

        const newOrder = { id: Date.now().toString(), name, phone, brickType, qty, governorate, address, totalPrice };
        data.orders.push(newOrder);
        saveData('site_orders', data.orders);

        const text = `طلب توريد جديد:%0Aالاسم: ${name}%0Aالهاتف: ${phone}%0Aالنوع: ${brickType}%0Aالكمية: ${qty}%0Aالمحافظة: ${governorate}%0Aالعنوان: ${address}%0Aالإجمالي: ${totalPrice}`;
        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, '_blank');

        showToast('تم إرسال الطلب وحفظه');
        e.target.reset();
    });
});
