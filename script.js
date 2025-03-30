// Elements
const elemId_numPeople = document.getElementById("numPeople")                       // 入力
const elemId_totalAmount = document.getElementById("totalAmount")

const elemId_totalPayment = document.getElementById("totalPayment")                 // 結果
const elemId_totalPercentage = document.getElementById("totalPercentage")
const elemId_errorMessage = document.getElementById("errorMessage")

const elemId_openModal = document.getElementById("btn_openOptionModal");            // Modal
const elemId_closeModal = document.getElementById("btn_closeOptionModal");
const elemId_modal = document.getElementById("calcModeModal");
const elemId_radioButtons = document.querySelectorAll("input[name='calcMode']");
const elemId_minUnit = document.getElementById("minUnit");

// 入力値の取得
function getInputValue() {
    numPeople = parseInt(elemId_numPeople.value);
    totalAmount = parseInt(elemId_totalAmount.value);
    if (isNaN(numPeople) || isNaN(totalAmount) || numPeople <= 0 || totalAmount <= 0) {
        return;
    }
}

// テーブル生成
function generateTable() {
    const tableBody = document.querySelector("#resultTable tbody");
    tableBody.innerHTML = "";   // テーブル初期化

    if (isNaN(numPeople) || isNaN(totalAmount) || numPeople <= 0 || totalAmount <= 0) {
        updateTotals();
        return;
    }

    // 整数部分と余りを取得
    let [evenSplit, remainder] = splitAmount(totalAmount, numPeople);

    // 計算モードに応じた処理
    let total_tmp = 0;
    let payment = 0;
    for (let i = 0; i < numPeople; i++) {

        // 支払金額の算出
        [payment, remainder, total_tmp] = calcPayment(
            totalAmount, numPeople, remainder, evenSplit, total_tmp, i);

        // 割合の算出
        let percentage = ((payment / totalAmount) * 100).toFixed(2);

        let row = document.createElement("tr");
        row.innerHTML = `
                    <td>${i + 1}</td>
                    <td><input type="number" value="${payment}" oninput="updatePercentage()"></td>
                    <td><input type="number" value="${percentage}" oninput="updatePayment()"></td>
                    <td><input type="checkbox" class="fixed" value="${i + 1}"></td>
                    `;
        tableBody.appendChild(row);
    }
    updateTotals();
}

// 合計行の更新
function updateTotals() {
    let totalPayment = 0;
    let totalPercentage = 0;
    const totalAmount = parseInt(elemId_totalAmount.value);
    const rows = document.querySelectorAll("#resultTable tbody tr");

    // 1行ずつ集計
    rows.forEach(row => {
        let payment = parseFloat(row.children[1].querySelector("input").value) || 0;    // 金額
        totalPayment += payment;
        let percentage = parseFloat(row.children[2].querySelector("input").value) || 0; // 割合
        totalPercentage += percentage;
    });

    // 合計行に値設定
    elemId_totalPayment.textContent = `${totalPayment} 円`;
    elemId_totalPercentage.textContent = `${totalPercentage.toFixed(2)} %`;

    elemId_errorMessage.textContent = totalPayment !== totalAmount ? "支払金額の合計が正しくありません" : "";
}

// テーブルの更新（再計算）
function updateTable() {

    // 固定フラグの取得
    const arrFixed = document.querySelectorAll(".fixed:checked");
    const fixedRows = arrFixed.length;

    // 固定行がない場合、通常どおり計算
    if (fixedRows === 0) {
        generateTable();
        return;
    }

    // 生成済みテーブル取得
    const rows = document.querySelectorAll("#resultTable tbody tr");

    //　固定行合計金額取得
    let total_tmp = 0
    let targetRow_tmp = 0
    rows.forEach(row => {

        targetRow_tmp++;

        //　固定行の場合
        for (let i = 0; i < fixedRows; i++) {
            if (Number(arrFixed[i].value) === targetRow_tmp) {
                total_tmp += parseFloat(row.children[1].querySelector("input").value) || 0;    // 金額
            }
        }
    });

    // 整数部分と余りを取得
    let totalPayment_tmp = totalAmount - total_tmp;
    let numPeople_tmp = numPeople - fixedRows;
    let [evenSplit, remainder] = splitAmount(totalPayment_tmp, numPeople_tmp);

    // 生成済みテーブルを１行ずつ処理
    let targetRow = 0;
    let total_tmp2 = 0;

    rows.forEach(row => {
        
        targetRow++;

        //　固定行の場合、処理をスキップ
        for (let i = 0; i < fixedRows; i++) {
            if (Number(arrFixed[i].value) === targetRow) {
                return;
            }
        }
        // 支払金額の算出
        let payment, percentage;
        [payment, remainder, total_tmp2] = calcPayment(
            totalPayment_tmp, numPeople_tmp, remainder, evenSplit, total_tmp2, targetRow - 1);

        // 割合の算出
        percentage = ((payment / totalAmount) * 100);

        // テーブル行の更新
        row.children[1].querySelector("input").value = payment;                     // 金額
        row.children[2].querySelector("input").value = percentage.toFixed(2);       // 割合
    });
    // 合計行の更新
    updateTotals();
}

// 金額を人数で割る
function splitAmount(p_totalAmount, p_numPeople){
    let l_evenSplit = (Math.floor((p_totalAmount / p_numPeople) / minUnit)) * minUnit;   // 整数部分
    let l_remainder = p_totalAmount - l_evenSplit * p_numPeople;                         // 余り
    return[l_evenSplit, l_remainder]
}

// 支払金額の算出
function calcPayment(p_totalAmount, p_numPeople, p_remainder, p_evenSplit, p_total_tmp, i) {
    let l_adjustment, l_payment, l_remainder, l_total_tmp;
    //　支払金額の算出
    switch (calcMode) {
        case "even":                                        // 余りを順番に配分
            if (p_remainder > 0) {
                l_adjustment = (p_remainder < minUnit ? p_remainder : minUnit);
                l_remainder = p_remainder - l_adjustment;
                l_payment = p_evenSplit + l_adjustment;
            } else {
                l_payment = p_evenSplit;
            }
            return [l_payment, l_remainder, 0];
            break;

        case "extraPay":                                     // 余りを1名が支払う
            l_payment = p_evenSplit + (i === 0 ? p_remainder : 0);
            return [l_payment, 0, 0];
            break;

        case "refund":                                       // 余りを１名がもらう
            l_adjustment = minUnit;
            l_payment = (i < p_numPeople - 1 ? p_evenSplit + l_adjustment : p_totalAmount - p_total_tmp);
            l_total_tmp = p_total_tmp + l_payment;
            return [l_payment, 0, l_total_tmp];
            break;

        default:
            break;
    }
}

// 各行の更新（金額入力時に「割合」を最新化）
function updatePercentage() {

    // 合計金額が０未満の場合は処理しない
    const totalAmount = parseInt(elemId_totalAmount.value);
    if (isNaN(totalAmount) || totalAmount <= 0) return;

    // 合計金額に対する割合を算出
    let totalPayment = 0;
    let totalPercentage = 0;
    const rows = document.querySelectorAll("#resultTable tbody tr");

    rows.forEach(row => {
        let payment = parseFloat(row.children[1].querySelector("input").value) || 0;    // 金額
        totalPayment += payment;
        let percentage = ((payment / totalAmount) * 100);                               // 割合
        totalPercentage += percentage;
        row.children[2].querySelector("input").value = percentage.toFixed(2);
    });

    // 合計行に値設定
    elemId_totalPayment.textContent = `${totalPayment} 円`;
    elemId_totalPercentage.textContent = `${totalPercentage.toFixed(2)} %`;

    if (totalPayment !== totalAmount) {
        elemId_errorMessage.textContent = "支払金額の合計が正しくありません";
        return;
    } else {
        elemId_errorMessage.textContent = "";
    }
}

// 各行の更新（割合入力時に「金額」を最新化）
function updatePayment() {

    // 合計金額が０未満の場合は処理しない
    const totalAmount = parseInt(elemId_totalAmount.value);
    if (isNaN(totalAmount) || totalAmount <= 0) return;

    // 割合に応じた支払金額を算出
    let totalPayment = 0;
    let totalPercentage = 0;
    const rows = document.querySelectorAll("#resultTable tbody tr");

    rows.forEach(row => {
        let percentage = parseFloat(row.children[2].querySelector("input").value) || 0; // 割合
        totalPercentage += percentage;
        let payment = ((percentage / 100) * totalAmount);                               // 金額
        totalPayment += payment;
        row.children[1].querySelector("input").value = payment;
    });

    // 合計行に値設定
    elemId_totalPayment.textContent = `${totalPayment} 円`;
    elemId_totalPercentage.textContent = `${totalPercentage.toFixed(2)} %`;

    if (totalPercentage !== 100) {
        elemId_errorMessage.textContent = "割合の合計が100%ではありません";
        return;
    } else {
        elemId_errorMessage.textContent = "";
    }
}

// モーダル：計算モード
document.addEventListener("DOMContentLoaded", function () {

    elemId_openModal.addEventListener("click", function () {   // 表示
        elemId_modal.style.display = "block";
    });

    elemId_closeModal.addEventListener("click", function () {  // 非表示
        elemId_modal.style.display = "none";
        updateTable();
    });

    window.addEventListener("click", function (event) {         // 非表示（画面外クリック）
        if (event.target === elemId_modal) {
            elemId_modal.style.display = "none";
            updateTable();
        }
    });

    elemId_radioButtons.forEach(radio => {
        radio.addEventListener("change", function () {          // ラジオボタン選択時
            calcMode = this.value;
        });
    });
});

// 最小単位の取得
document.addEventListener("DOMContentLoaded", function () {
    elemId_minUnit.addEventListener("change", function () {
        minUnit = parseInt(elemId_minUnit.value, 10);
    });
});

// 人数・金額の入力時にテーブル生成
document.addEventListener("DOMContentLoaded", function () {
    elemId_numPeople.addEventListener("input", function () {
        getInputValue();
        generateTable();
    });
    elemId_totalAmount.addEventListener("input", function () {
        getInputValue();
        generateTable();
    });
});

// 初期値設定
let calcMode = "even";
let minUnit = 1000;
let numPeoplem, totalAmount;