const WHATSAPP_NUMBER = '201143348433';
// استبدل الرابط أدناه برابط الباك إند الحقيقي الخاص بك على Railway بدون شُرطة مائلة في الآخر
const API_BASE_URL = 'https://your-backend-railway-url.railway.app';

let siteData = {
    bricks: [],
    governorates: [],
    orders: []
};

// جلب البيانات من السيرفر (Backend) بدلاً من التخزين المحلي
async function fetchServerData() {
    try {
        const [bricksRes, govsRes] = await Promise.all([
            fetch(`${API_BASE_URL}/api/products`),
            fetch(`${API_BASE_URL}/api/governorates`)
        ]);

        if (bricksRes.ok) siteData.bricks = await bricksRes.json();
        if (govsRes.ok) siteData.governorates = await govsRes.json();
        
        renderClientViews();
    } catch (error) {
        console.error('خطأ في الاتصال بالسيرفر:', error);
        showToast('تعذر الاتصال بقاعدة البيانات', 'error');
    }
}

async function renderClientViews() {
    const grid = document.getElementById('pricesDisplayGrid');
    const catalogGovBody = document.getElementById('catalogFreightTableBody');
    const typeSelect = document.getElementById('reqType');
    const govSelect = document.getElementById('reqGovernorate');

    if (!grid) return;

    grid.innerHTML = '';
    if (typeSelect) typeSelect.innerHTML = '';
    if (govSelect) govSelect.innerHTML = '';
    if (catalogGovBody) catalogGovBody.innerHTML = '';

    const defaultFreight = siteData.governorates.length > 0 ? siteData.governorates[0].freight : 0;

    siteData.bricks.forEach(brick => {
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

    siteData.governorates.forEach(gov => {
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
    const typeId = document.getElementById('reqType')?.value;
    const qty = parseFloat(document.getElementById('reqQty')?.value) || 0;
    const govId = document.getElementById('reqGovernorate')?.value;

    const selectedBrick = siteData.bricks.find(b => String(b.id) === String(typeId));
    const selectedGov = siteData.governorates.find(g => String(g.id) === String(govId));

    const bPrice = selectedBrick ? selectedBrick.price : 0;
    const gFreight = selectedGov ? selectedGov.freight : 0;

    const total = (qty / 1000) * (parseFloat(bPrice) + parseFloat(gFreight));
    const targetInput = document.getElementById('estimatedPrice');
    
    if (targetInput) {
        targetInput.value = total.toLocaleString() + ' ج.م';
    }
}

async function renderAdminPanel() {
    // جلب أحدث البيانات للوحة التحكم
    try {
        const [bricksRes, govsRes, ordersRes] = await Promise.all([
            fetch(`${API_BASE_URL}/api/products`),
            fetch(`${API_BASE_URL}/api/governorates`),
            fetch(`${API_BASE_URL}/api/orders`, { credentials: 'include' })
        ]);

        if (bricksRes.ok) siteData.bricks = await bricksRes.json();
        if (govsRes.ok) siteData.governorates = await govsRes.json();
        if (ordersRes.ok) siteData.orders = await ordersRes.json();
    } catch (e) {
        console.error('خطأ في جلب بيانات الإدارة', e);
    }

    const pContainer = document.getElementById('adminPriceControls');
    if (pContainer) {
        pContainer.innerHTML = '';
        siteData.bricks.forEach(b => {
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
        siteData.governorates.forEach(g => {
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
        siteData.orders.forEach(o => {
            oBody.innerHTML += `
                <tr>
                    <td>${o.name || ''}</td>
                    <td>${o.phone || ''}</td>
                    <td>${o.brickType || ''} (${o.qty || ''})</td>
                    <td>${o.governorate || ''} - ${o.address || ''}</td>
                    <td>${o.totalPrice || ''}</td>
                    <td><button class="btn-submit btn-cancel" onclick="deleteOrder('${o.id}')">حذف</button></td>
                </tr>
            `;
        });
        const totalElem = document.getElementById('totalOrdersCount');
        if (totalElem) totalElem.innerText = siteData.orders.length;
    }
}

async function saveBrickData(id) {
    const price = document.getElementById(`price_${id}`).value;
    const size = document.getElementById(`size_${id}`).value;
    const brick = siteData.bricks.find(b => String(b.id) === String(id));

    if (!brick) return;

    const updatedData = { ...brick, price: parseFloat(price), size: size };

    try {
        const res = await fetch(`${API_BASE_URL}/api/products/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData),
            credentials: 'include'
        });

        if (res.ok) {
            showToast('تم تحديث السعر والمقاس بنجاح');
            renderAdminPanel();
            renderClientViews();
        } else {
            showToast('فشل التحديث، تأكد من صلاحيات الأدمن', 'error');
        }
    } catch (e) {
        showToast('خطأ في الاتصال', 'error');
    }
}

async function deleteBrick(id) {
    if (!confirm('هل تريد حذف هذا النوع؟')) return;
    try {
        const res = await fetch(`${API_BASE_URL}/api/products/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        if (res.ok) {
            showToast('تم الحذف');
            renderAdminPanel();
            renderClientViews();
        } else {
            showToast('فشل الحذف', 'error');
        }
    } catch (e) {
        showToast('خطأ في الاتصال', 'error');
    }
}

async function saveGovData(id) {
    const freight = document.getElementById(`gov_${id}`).value;
    const gov = siteData.governorates.find(g => String(g.id) === String(id));

    if (!gov) return;

    const updatedData = { ...gov, freight: parseFloat(freight) };

    try {
        const res = await fetch(`${API_BASE_URL}/api/governorates/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData),
            credentials: 'include'
        });

        if (res.ok) {
            showToast('تم تحديث أسعار المشال');
            renderAdminPanel();
            renderClientViews();
        } else {
            showToast('فشل التحديث', 'error');
        }
    } catch (e) {
        showToast('خطأ في الاتصال', 'error');
    }
}

async function deleteGov(id) {
    if (!confirm('هل تريد حذف المحافظة؟')) return;
    try {
        const res = await fetch(`${API_BASE_URL}/api/governorates/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        if (res.ok) {
            showToast('تم الحذف');
            renderAdminPanel();
            renderClientViews();
        } else {
            showToast('فشل الحذف', 'error');
        }
    } catch (e) {
        showToast('خطأ في الاتصال', 'error');
    }
}

async function deleteOrder(id) {
    try {
        const res = await fetch(`${API_BASE_URL}/api/orders/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        if (res.ok) {
            showToast('تم حذف الطلب');
            renderAdminPanel();
        } else {
            showToast('فشل حذف الطلب', 'error');
        }
    } catch (e) {
        showToast('خطأ في الاتصال', 'error');
    }
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

async function logoutAdmin() {
    try {
        await fetch(`${API_BASE_URL}/api/logout`, { method: 'POST', credentials: 'include' });
    } catch (e) {}

    document.getElementById('adminPortal').style.display = 'none';
    document.getElementById('adminNav').style.display = 'none';
    document.getElementById('clientPortal').style.display = 'block';
    document.getElementById('clientNav').style.display = 'flex';
    fetchServerData();
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
    fetchServerData();

    // التحقق من الجلسة عند البداية
    fetch(`${API_BASE_URL}/api/check-session`, { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
            if (data.isAdmin) {
                showAdminDashboard();
            }
        }).catch(err => console.log('Session check failed', err));

    document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;

        try {
            const res = await fetch(`${API_BASE_URL}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
                credentials: 'include'
            });
            const data = await res.json();

            if (data.success && data.role === 'admin') {
                showAdminDashboard();
                showToast('تم الدخول بنجاح');
            } else {
                showToast(data.message || 'خطأ في بيانات الدخول', 'error');
            }
        } catch (err) {
            showToast('خطأ في الاتصال بالخادم', 'error');
        }
    });

    document.getElementById('clientOrderForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('reqName').value;
        const phone = document.getElementById('reqPhone').value;
        const typeSelect = document.getElementById('reqType');
        const brickType = typeSelect.options[typeSelect.selectedIndex].text;
        const qty = document.getElementById('reqQty').value;
        const govSelect = document.getElementById('reqGovernorate');
        const governorate = govSelect.options[govSelect.selectedIndex].text;
        const address = document.getElementById('reqAddress').value;
        const totalPrice = document.getElementById('estimatedPrice').value;

        const newOrder = { name, phone, brickType, qty, governorate, address, totalPrice };

        try {
            const res = await fetch(`${API_BASE_URL}/api/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newOrder)
            });

            if (res.ok) {
                const text = `طلب توريد جديد:%0Aالاسم: ${name}%0Aالهاتف: ${phone}%0Aالنوع: ${brickType}%0Aالكمية: ${qty}%0Aالمحافظة: ${governorate}%0Aالعنوان: ${address}%0Aالإجمالي: ${totalPrice}`;
                window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, '_blank');
                showToast('تم إرسال الطلب وحفظه في القاعدة بنجاح');
                e.target.reset();
            } else {
                showToast('فشل حفظ الطلب', 'error');
            }
        } catch (err) {
            showToast('خطأ في الاتصال بالسيرفر', 'error');
        }
    });
});
