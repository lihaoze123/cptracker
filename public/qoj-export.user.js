// ==UserScript==
// @name         QOJ AC题目导出工具
// @namespace    https://cptracker.dev
// @version      1.0.0
// @description  导出 QOJ (Quality Online Judge) 已通过题目为 CSV 格式，支持导入 CPTracker
// @author       CPTracker
// @match        https://qoj.ac/submissions*
// @match        https://qoj.ac/user/profile/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // 添加导出按钮到页面
    function addExportButton() {
        // 检查是否已存在按钮
        if (document.getElementById('qoj-export-btn')) {
            return;
        }

        const container = document.querySelector('.container') || document.body;
        const button = document.createElement('button');
        button.id = 'qoj-export-btn';
        button.textContent = '📥 导出 AC 题目';
        button.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            z-index: 9999;
            padding: 10px 16px;
            background: #3b82f6;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            transition: all 0.2s ease;
        `;
        button.onmouseover = () => {
            button.style.background = '#2563eb';
            button.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
        };
        button.onmouseout = () => {
            button.style.background = '#3b82f6';
            button.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
        };
        button.onclick = startExport;
        container.appendChild(button);
    }

    // 显示进度
    function showProgress(message) {
        let progressDiv = document.getElementById('qoj-export-progress');
        if (!progressDiv) {
            progressDiv = document.createElement('div');
            progressDiv.id = 'qoj-export-progress';
            progressDiv.style.cssText = `
                position: fixed;
                top: 160px;
                right: 20px;
                z-index: 9999;
                padding: 16px 20px;
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                font-size: 14px;
                min-width: 280px;
            `;
            document.body.appendChild(progressDiv);
        }
        progressDiv.innerHTML = `
            <div style="font-weight: 500; color: #333; font-size: 13px;">${message}</div>
            <div style="margin-top: 10px; width: 100%; height: 6px; background: #e5e7eb; border-radius: 3px; overflow: hidden;">
                <div style="width: 100%; height: 100%; background: #3b82f6; animation: pulse 1.5s ease-in-out infinite;">
                    <style>
                        @keyframes pulse {
                            0%, 100% { opacity: 0.6; }
                            50% { opacity: 1; }
                        }
                    </style>
                </div>
            </div>
        `;
    }

    // 移除进度显示
    function hideProgress() {
        const progressDiv = document.getElementById('qoj-export-progress');
        if (progressDiv) {
            progressDiv.remove();
        }
    }

    // 解析当前页面的提交记录
    function parseCurrentPage() {
        const problems = [];
        const table = document.querySelector('.table-responsive table');

        if (!table) {
            console.error('未找到提交记录表格');
            return problems;
        }

        const rows = table.querySelectorAll('tbody tr');
        rows.forEach(row => {
            try {
                // 第2列：题目链接和名称
                const problemCell = row.querySelector('td:nth-child(2) a');
                // 第9列：提交时间
                const timeCell = row.querySelector('td:nth-child(9) small');

                if (problemCell && timeCell) {
                    const problemHref = problemCell.getAttribute('href');
                    const problemText = problemCell.textContent.trim();
                    const timeText = timeCell.textContent.trim();

                    // 解析问题ID
                    const problemIdMatch = problemHref?.match(/\/problem\/(\d+)/);
                    if (problemIdMatch) {
                        const problemId = problemIdMatch[1];
                        problems.push({
                            url: `https://qoj.ac/problem/${problemId}`,
                            name: problemText,
                            date: timeText
                        });
                    }
                }
            } catch (e) {
                console.warn('解析行失败:', e);
            }
        });

        return problems;
    }

    // 延迟函数
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // 从当前 URL 获取用户名
    function getUsernameFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('submitter');
    }

    // 导出主函数
    async function startExport() {
        const username = getUsernameFromUrl();

        if (!username) {
            alert('请在 URL 中包含 submitter 参数，例如:\nhttps://qoj.ac/submissions?submitter=你的用户名&min_score=100');
            return;
        }

        // 检查是否已经在正确的 URL 上
        const currentUrl = new URL(window.location.href);
        const hasMinScore = currentUrl.searchParams.get('min_score');
        if (!hasMinScore) {
            if (confirm('需要跳转到已通过的提交页面继续导出吗？')) {
                window.location.href = `https://qoj.ac/submissions?submitter=${username}&min_score=100`;
            }
            return;
        }

        // 解析当前页面
        showProgress('正在解析第 1 页...');
        let allProblems = parseCurrentPage();
        let page = 1;

        // 如果第一页就没有数据，直接结束
        if (allProblems.length === 0) {
            finishExport(allProblems);
            return;
        }

        // 记录上一页的题目 URL 集合，用于检测是否到达最后一页
        let prevPageUrls = new Set(allProblems.map(p => p.url));

        // 添加延迟
        await sleep(500);

        // 多页处理：逐页遍历直到没有数据
        while (true) {
            page += 1;
            showProgress(`正在爬取第 ${page} 页...`);

            try {
                const response = await fetch(`https://qoj.ac/submissions?submitter=${username}&min_score=100&page=${page}`);
                if (!response.ok) {
                    console.warn(`第 ${page} 页请求失败: HTTP ${response.status}`);
                    break;
                }

                const html = await response.text();
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');

                // 解析这一页的题目
                const rows = doc.querySelectorAll('tbody tr');

                // 如果没有数据行，说明已经到达最后一页
                if (rows.length === 0) {
                    break;
                }

                const currentPageProblems = [];
                rows.forEach(row => {
                    try {
                        const problemCell = row.querySelector('td:nth-child(2) a');
                        const timeCell = row.querySelector('td:nth-child(9) small');

                        if (problemCell && timeCell) {
                            const problemHref = problemCell.getAttribute('href');
                            const problemText = problemCell.textContent.trim();
                            const timeText = timeCell.textContent.trim();

                            const problemIdMatch = problemHref?.match(/\/problem\/(\d+)/);
                            if (problemIdMatch) {
                                const problemId = problemIdMatch[1];
                                const problemUrl = `https://qoj.ac/problem/${problemId}`;
                                currentPageProblems.push({
                                    url: problemUrl,
                                    name: problemText,
                                    date: timeText
                                });
                            }
                        }
                    } catch (e) {
                        console.warn('解析行失败:', e);
                    }
                });

                // 如果当前页没有解析到任何题目，结束遍历
                if (currentPageProblems.length === 0) {
                    break;
                }

                // 检查当前页的所有题目是否都在上一页出现过
                // 如果是，说明已经到达最后一页（服务器返回了重复内容）
                const allDuplicate = currentPageProblems.every(p => prevPageUrls.has(p.url));
                if (allDuplicate) {
                    console.log(`第 ${page} 页内容与上一页重复，已到达最后一页`);
                    break;
                }

                // 添加当前页的新题目
                currentPageProblems.forEach(p => {
                    if (!prevPageUrls.has(p.url)) {
                        allProblems.push(p);
                    }
                });

                // 更新上一页的 URL 集合
                prevPageUrls = new Set(currentPageProblems.map(p => p.url));

                // 添加延迟避免请求过快
                await sleep(500);

            } catch (e) {
                console.error(`爬取第 ${page} 页失败:`, e);
                break;
            }
        }

        finishExport(allProblems);
    }

    // 完成导出
    function finishExport(problems) {
        hideProgress();

        if (problems.length === 0) {
            alert('未找到任何已通过的题目！');
            return;
        }

        // 去重：保留最早的 AC 时间
        const problemMap = new Map();
        problems.forEach(p => {
            const existing = problemMap.get(p.url);
            if (!existing || p.date < existing.date) {
                problemMap.set(p.url, p);
            }
        });

        // 按日期排序
        const uniqueProblems = Array.from(problemMap.values()).sort((a, b) => {
            return new Date(a.date) - new Date(b.date);
        });

        // 生成 CSV（CPTracker 格式）
        const csvRows = [['题目', '题目名称', '难度', '题解', '关键词', '日期']];
        uniqueProblems.forEach(p => {
            csvRows.push([
                p.url,
                p.name,
                '', // QOJ 没有难度显示
                '', // 题解
                '', // 关键词
                p.date.replace(/-/g, '/').replace(' ', ' ') // 格式化为 YYYY/MM/DD HH:mm:ss
            ]);
        });

        // 下载 CSV
        const csvContent = '\uFEFF' + csvRows.map(row =>
            row.map(cell => {
                // 如果包含逗号、引号或换行，需要用引号包裹并转义
                const cellStr = String(cell);
                if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
                    return '"' + cellStr.replace(/"/g, '""') + '"';
                }
                return cellStr;
            }).join(',')
        ).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `qoj-ac-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        alert(`导出成功！共 ${uniqueProblems.length} 道题目。\n\n现在可以将 CSV 文件导入到 CPTracker 中。`);
    }

    // 初始化
    function init() {
        // 延迟添加按钮，确保页面加载完成
        setTimeout(() => {
            addExportButton();
        }, 500);
    }

    // 监听页面变化（SPA 路由切换）
    const observer = new MutationObserver(() => {
        addExportButton();
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // 初始运行
    init();

})();
