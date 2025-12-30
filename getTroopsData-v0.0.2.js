// ==UserScript==
// @name         TW Debug
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Debug script
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    
    alert('Script loaded on: ' + window.location.href);
    
    if (window.location.href.includes('tribalwars')) {
        alert('On Tribal Wars site!');
        
        // Просто добавляем кнопку
        var btn = document.createElement('button');
        btn.innerHTML = 'GET TROOPS';
        btn.style = 'position:fixed;top:20px;left:20px;z-index:9999;padding:10px;background:blue;color:white;';
        
        btn.onclick = function() {
            // Простой сбор данных
            var troops = {};
            $('img[src*="unit_"]').each(function() {
                var src = $(this).attr('src');
                var match = src.match(/unit_(\w+)\./);
                if (match) {
                    troops[match[1]] = (troops[match[1]] || 0) + 1;
                }
            });
            
            alert('Found troops: ' + JSON.stringify(troops));
        };
        
        document.body.appendChild(btn);
    }
})();
