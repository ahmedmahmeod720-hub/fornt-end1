// =============================================
// مؤسسة العمار مصر - الجافاسكريبت
// =============================================
// تم تحويل localStorage إلى fetch() للاتصال بالباك إند
// =============================================

const WHATSAPP_NUMBER = '201143348433';

// عنوان الباك إند (سبرينج بوت)
// غيّر البورت لو شغّال على بورت تاني
const API_BASE = 'http://localhost:8080';

// ===== البيانات المحملة من الباك إند (كاش في الذاكرة) =====
let bricks = [];
let governorates = [];

// =============================================
// تحميل البيانات من الباك إند
// =============================================
async function loadData() {
    try {
        const [bricksRes, govsRes] = await Promise.all([
            fetch(API_BASE + '/api/products', { credentials: 'include' }),
            fetch(API_BASE + '/api/governorates', { credentials: 'include' })
        ]);
        bricks = await bricksRes.json();
        governorates = await govsRes.json();
    } catch (err) {
        console.error('خطأ في تحميل البيانات:', err);
    }
}

// =============================================
// عرض الصفحة الرئيسية (أسعار الطوب + المحافظات)
// =============================================
function renderClientViews() {
    const grid = document.getElementById('pricesDisplayGrid');
    const catalogGovBody = document.getElementById('catalogFreightTableBody');
    const typeSelect = document.getElementById('reqType');
    const govSelect = document.getElementById('reqGovernorate');

    if (!grid) return;

    grid.innerHTML = '';
    if (typeSelect) typeSelect.innerHTML = '';
    if (govSelect) govSelect.innerHTML = '';
    if (catalogGovBody) catalogGovBody.innerHTML = '';

    const defaultFreight = governorates.length > 0 ? governorates[0].freight : 0;

    bricks.forEach(brick => {
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

    governorates.forEach(gov => {
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

// =============================================
// حساب إجمالي الطلب
// =============================================
function calculateOrderTotal() {
    const typeId = document.getElementById('reqType')?.value;
    const qty = parseFloat(document.getElementById('reqQty')?.value) || 0;
    const govId = document.getElementById('reqGovernorate')?.value;

    // نستخدم == بدل === لأن الـ id رقم من الباك إند والـ value نص من الـ select
    const selectedBrick = bricks.find(b => b.id == typeId);
    const selectedGov = governorates.find(g => g.id == govId);

    const bPrice = selectedBrick ? selectedBrick.price : 0;
    const gFreight = selectedGov ? selectedGov.freight : 0;

    const total = (qty / 1000) * (parseFloat(bPrice) + parseFloat(gFreight));
    const targetInput = document.getElementById('estimatedPrice');

    if (targetInput) {
        targetInput.value = total.toLocaleString() + ' ج.م';
    }
}

// =============================================
// عرض لوحة الإدارة
// =============================================
async function renderAdminPanel() {
    // ===== قسم أسعار الطوب =====
    const pContainer = document.getElementById('adminPriceControls');
    if (pContainer) {
        pContainer.innerHTML = '';
        bricks.forEach(b => {
            pContainer.innerHTML += `
                <div style="margin-bottom:12px; background: rgba(255,255,255,0.03); padding: 10px; border-radius: 6px;">
                    <label style="color:var(--accent); font-weight:bold;">🧱 ${b.name}</label>
                    <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top: 6px;">
                        <input type="text" id="name_${b.id}" value="${b.name}" placeholder="الاسم">
                        <input type="number" id="price_${b.id}" value="${b.price}">
                        <input type="text" id="size_${b.id}" value="${b.size || ''}">
                        <button class="btn-submit" onclick="saveBrickData(${b.id})">حفظ</button>
                        <button class="btn-submit btn-cancel" onclick="deleteBrick(${b.id})">حذف</button>
                    </div>
                </div>`;
        });
    }

    // ===== قسم المحافظات =====
    const gBody = document.getElementById('adminFreightTableBody');
    if (gBody) {
        gBody.innerHTML = '';
        governorates.forEach(g => {
            gBody.innerHTML += `
                <tr>
                    <td>📍 ${g.name}</td>
                    <td><input type="number" id="gov_${g.id}" value="${g.freight}" style="width: 100px;"> ج.م</td>
                    <td>
                        <button class="btn-submit" onclick="saveGovData(${g.id})">حفظ</button>
                        <button class="btn-submit btn-cancel" onclick="deleteGov(${g.id})">حذف</button>
                    </td>
                </tr>
            `;
        });
    }

    // ===== قسم الطلبات (يجيبها من الباك إند) =====
    try {
        const ordersRes = await fetch(API_BASE + '/api/orders', { credentials: 'include' });
        if (ordersRes.ok) {
            const orders = await ordersRes.json();
            const oBody = document.getElementById('adminOrdersTableBody');
            if (oBody) {
                oBody.innerHTML = '';
                orders.forEach(o => {
                    oBody.innerHTML += `
                        <tr>
                            <td>${o.name}</td>
                            <td>${o.phone}</td>
                            <td>${o.brickType} (${o.quantity})</td>
                            <td>${o.governorate} - ${o.address}</td>
                            <td>${o.totalPrice}</td>
                            <td><button class="btn-submit btn-cancel" onclick="deleteOrder(${o.id})">حذف</button></td>
                        </tr>
                    `;
                });
                const totalElem = document.getElementById('totalOrdersCount');
                if (totalElem) totalElem.innerText = orders.length;
            }
        }
    } catch (err) {
        console.error('خطأ في تحميل الطلبات:', err);
    }
}

// =============================================
// عمليات الأدمن - المنتجات
// =============================================

async function saveBrickData(id) {
    const name = document.getElementById(`name_${id}`).value;
    const price = document.getElementById(`price_${id}`).value;
    const size = document.getElementById(`size_${id}`).value;

    try {
        const res = await fetch(API_BASE + `/api/products/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ name: name, price: parseFloat(price), size: size })
        });

        if (res.ok) {
            await loadData();
            renderAdminPanel();
            renderClientViews();
            showToast('تم تحديث السعر والمقاس بنجاح');
        } else if (res.status === 403) {
            showToast('غير مسموح - يجب تسجيل الدخول كمدير', 'error');
        }
    } catch (err) {
        showToast('خطأ في الاتصال بالسيرفر', 'error');
    }
}

async function deleteBrick(id) {
    if (!confirm('هل تريد حذف هذا النوع؟')) return;
    try {
        const res = await fetch(API_BASE + `/api/products/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        if (res.ok) {
            await loadData();
            renderAdminPanel();
            renderClientViews();
            showToast('تم الحذف');
        } else if (res.status === 403) {
            showToast('غير مسموح', 'error');
        }
    } catch (err) {
        showToast('خطأ في الاتصال بالسيرفر', 'error');
    }
}

// =============================================
// عمليات الأدمن - المحافظات
// =============================================

async function saveGovData(id) {
    const freight = document.getElementById(`gov_${id}`).value;
    const gov = governorates.find(g => g.id == id);

    try {
        const res = await fetch(API_BASE + `/api/governorates/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ name: gov.name, freight: parseFloat(freight) })
        });
        if (res.ok) {
            await loadData();
            renderAdminPanel();
            renderClientViews();
            showToast('تم تحديث أسعار المشال');
        } else if (res.status === 403) {
            showToast('غير مسموح', 'error');
        }
    } catch (err) {
        showToast('خطأ في الاتصال بالسيرفر', 'error');
    }
}

async function deleteGov(id) {
    if (!confirm('هل تريد حذف المحافظة؟')) return;
    try {
        const res = await fetch(API_BASE + `/api/governorates/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        if (res.ok) {
            await loadData();
            renderAdminPanel();
            renderClientViews();
            showToast('تم الحذف');
        } else if (res.status === 403) {
            showToast('غير مسموح', 'error');
        }
    } catch (err) {
        showToast('خطأ في الاتصال بالسيرفر', 'error');
    }
}

// =============================================
// عمليات الأدمن - الطلبات
// =============================================

async function deleteOrder(id) {
    try {
        const res = await fetch(API_BASE + `/api/orders/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        if (res.ok) {
            showToast('تم حذف الطلب');
            renderAdminPanel();
        } else if (res.status === 403) {
            showToast('غير مسموح', 'error');
        }
    } catch (err) {
        showToast('خطأ في الاتصال بالسيرفر', 'error');
    }
}

// =============================================
// التنقل بين الصفحات
// =============================================

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

function openAdminModal() {
    document.getElementById('adminAuthModal').style.display = 'flex';
}

function closeAdminModal() {
    document.getElementById('adminAuthModal').style.display = 'none';
}

async function showAdminDashboard() {
    closeAdminModal();
    document.getElementById('clientPortal').style.display = 'none';
    document.getElementById('clientNav').style.display = 'none';
    document.getElementById('adminPortal').style.display = 'block';
    document.getElementById('adminNav').style.display = 'flex';
    await renderAdminPanel();
}

async function logoutAdmin() {
    try {
        await fetch(API_BASE + '/api/logout', {
            method: 'POST',
            credentials: 'include'
        });
    } catch (err) {
        // تجاهل الخطأ
    }
    sessionStorage.removeItem('is_admin');
    document.getElementById('adminPortal').style.display = 'none';
    document.getElementById('adminNav').style.display = 'none';
    document.getElementById('clientPortal').style.display = 'block';
    document.getElementById('clientNav').style.display = 'flex';
    renderClientViews();
    showToast('تم الخروج من لوحة التحكم');
}

// =============================================
// إشعارات (Toast)
// =============================================

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

// =============================================
// تشغيل الصفحة
// =============================================

document.addEventListener('DOMContentLoaded', async () => {
    // 1. حمّل البيانات من الباك إند
    await loadData();

    // 2. اعرض الصفحة الرئيسية
    renderClientViews();

    // 3. لو كان مسجل دخول كأدمن، اتحقق من الباك إند
    if (sessionStorage.getItem('is_admin') === 'true') {
        try {
            const res = await fetch(API_BASE + '/api/check-session', { credentials: 'include' });
            const data = await res.json();
            if (data.isAdmin) {
                showAdminDashboard();
            } else {
                // السيشن انتهت في الباك إند
                sessionStorage.removeItem('is_admin');
            }
        } catch (err) {
            sessionStorage.removeItem('is_admin');
        }
    }

    // ربط الحساب التلقائي عند تغيير المدخلات
    ['reqType', 'reqQty', 'reqGovernorate'].forEach(id => {
        document.getElementById(id)?.addEventListener('input', calculateOrderTotal);
        document.getElementById(id)?.addEventListener('change', calculateOrderTotal);
    });

    // ===== فورم تسجيل الدخول =====
    document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const u = document.getElementById('loginUsername').value;
        const p = document.getElementById('loginPassword').value;

        try {
            const res = await fetch(API_BASE + '/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ username: u, password: p })
            });
            const data = await res.json();

            if (data.success && data.role === 'admin') {
                sessionStorage.setItem('is_admin', 'true');
                showAdminDashboard();
                showToast('تم الدخول بنجاح');
            } else {
                showToast('خطأ في بيانات الدخول', 'error');
            }
        } catch (err) {
            showToast('خطأ في الاتصال بالسيرفر', 'error');
        }
    });

    // ===== فورم إضافة طوب جديد =====
    document.getElementById('addBrickForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('newBrickName').value;
        const price = parseFloat(document.getElementById('newBrickPrice').value);
        const size = document.getElementById('newBrickSize').value;

        try {
            const res = await fetch(API_BASE + '/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ name, price, size })
            });
            if (res.ok) {
                await loadData();
                showToast('تمت إضافة الطوب');
                e.target.reset();
                renderAdminPanel();
                renderClientViews();
            } else if (res.status === 403) {
                showToast('غير مسموح', 'error');
            }
        } catch (err) {
            showToast('خطأ في الاتصال بالسيرفر', 'error');
        }
    });

    // ===== فورم إضافة محافظة جديدة =====
    document.getElementById('addGovForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('newGovName').value;
        const freight = parseFloat(document.getElementById('newGovFreight').value);

        try {
            const res = await fetch(API_BASE + '/api/governorates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ name, freight })
            });
            if (res.ok) {
                await loadData();
                showToast('تمت إضافة المحافظة');
                e.target.reset();
                renderAdminPanel();
                renderClientViews();
            } else if (res.status === 403) {
                showToast('غير مسموح', 'error');
            }
        } catch (err) {
            showToast('خطأ في الاتصال بالسيرفر', 'error');
        }
    });

    // ===== فورم إرسال الطلب =====
    document.getElementById('clientOrderForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('reqName').value;
        const phone = document.getElementById('reqPhone').value;
        const typeSelect = document.getElementById('reqType');
        const brickType = typeSelect.options[typeSelect.selectedIndex].text;
        const quantity = parseInt(document.getElementById('reqQty').value);
        const govSelect = document.getElementById('reqGovernorate');
        const governorate = govSelect.options[govSelect.selectedIndex].text;
        const address = document.getElementById('reqAddress').value;
        const totalPrice = document.getElementById('estimatedPrice').value;

        // احفظ الطلب في الباك إند
        try {
            await fetch(API_BASE + '/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ name, phone, brickType, quantity, governorate, address, totalPrice })
            });
        } catch (err) {
            console.error('خطأ في حفظ الطلب:', err);
        }

        // ابعت على واتساب
        const text = encodeURIComponent(`طلب توريد جديد:\nالاسم: ${name}\nالهاتف: ${phone}\nالنوع: ${brickType}\nالكمية: ${quantity}\nالمحافظة: ${governorate}\nالعنوان: ${address}\nالإجمالي: ${totalPrice}`);
        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, '_blank');

        showToast('تم إرسال الطلب وحفظه');
        e.target.reset();
    });
});