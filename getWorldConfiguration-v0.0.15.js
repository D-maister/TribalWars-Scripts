//javascript:
(function(){
    var server = location.hostname.split('.')[0];
    
    function parseXml(xml){
        var o={};
        $(xml).children().each(function(){
            var n=$(this), t=n.prop("tagName");
            if(n.children().length>0&&n.children()[0].nodeType===1)o[t]=parseXml(n);
            else o[t]=n.text();
        });
        return o;
    }
    
    var cfg=null,bld=null;
    
    $.ajax({async:0,url:'/interface.php?func=get_config',dataType:'xml',
        success:function(x){cfg=parseXml(x).config;}});
    
    $.ajax({async:0,url:'/interface.php?func=get_building_info',dataType:'xml',
        success:function(x){bld=parseXml(x).config;}});
    
    // Делаем функции глобальными для обработчиков onclick
    window.showTab = function(n){
        var c=document.getElementById('content');
        var b1=document.getElementById('btnCfg');
        var b2=document.getElementById('btnBld');
        
        if(n===0){
            b1.style.background='#333';b1.style.color='#fff';
            b2.style.background='#eee';b2.style.color='#333';
            showConfig();
        }else{
            b1.style.background='#eee';b1.style.color='#333';
            b2.style.background='#333';b2.style.color='#fff';
            showBuildings();
        }
    };
    
    function showConfig(){
        var c=document.getElementById('content');
        if(!cfg){c.innerHTML='<div style="padding:20px;text-align:center;">Loading...</div>';return;}
        
        var h='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:10px;">';
        
        // Basic
        h+=`<div style="border:1px solid #333;border-radius:3px;overflow:hidden;">
            <div style="background:#333;color:#fff;padding:8px;font-weight:bold;">Basic</div>
            <div style="padding:8px;">`;
        if(cfg.speed)h+=`<div style="display:flex;justify-content:space-between;padding:4px 0;">
            <span>speed:</span><b>${cfg.speed}</b></div>`;
        if(cfg.unit_speed)h+=`<div style="display:flex;justify-content:space-between;padding:4px 0;">
            <span>unit_speed:</span><b>${cfg.unit_speed}</b></div>`;
        if(cfg.speed&&cfg.unit_speed)h+=`<div style="display:flex;justify-content:space-between;padding:4px 0;">
            <span>world_speed:</span><b>${(cfg.speed*cfg.unit_speed).toFixed(2)}</b></div>`;
        h+='</div></div>';
        
        // Game
        if(cfg.game){
            h+=`<div style="border:1px solid #333;border-radius:3px;overflow:hidden;">
                <div style="background:#333;color:#fff;padding:8px;font-weight:bold;">Game</div>
                <div style="padding:8px;">`;
            for(var k in cfg.game){
                if(cfg.game[k]!=='')h+=`<div style="display:flex;justify-content:space-between;padding:4px 0;">
                    <span>${k}:</span><b>${cfg.game[k]==='1'?'✓':cfg.game[k]==='0'?'✗':cfg.game[k]}</b></div>`;
            }
            h+='</div></div>';
        }
        
        // Map
        if(cfg.coord){
            h+=`<div style="border:1px solid #333;border-radius:3px;overflow:hidden;">
                <div style="background:#333;color:#fff;padding:8px;font-weight:bold;">Map</div>
                <div style="padding:8px;">`;
            for(var k in cfg.coord){
                if(cfg.coord[k]!=='')h+=`<div style="display:flex;justify-content:space-between;padding:4px 0;">
                    <span>${k}:</span><b>${cfg.coord[k]}</b></div>`;
            }
            h+='</div></div>';
        }
        
        // Other categories
        var cats=['snob','ally','sitter','sleep','night','win','premium','awards','misc','commands','newbie'];
        cats.forEach(function(cat){
            if(cfg[cat]){
                h+=`<div style="border:1px solid #666;border-radius:3px;overflow:hidden;">
                    <div style="background:#666;color:#fff;padding:6px;font-weight:bold;">${cat}</div>
                    <div style="padding:6px;">`;
                for(var k in cfg[cat]){
                    if(cfg[cat][k]!=='')h+=`<div style="display:flex;justify-content:space-between;padding:2px 0;">
                        <span style="font-size:11px;">${k}:</span><b style="font-size:11px;">${cfg[cat][k]==='1'?'✓':cfg[cat][k]==='0'?'✗':cfg[cat][k]}</b></div>`;
                }
                h+='</div></div>';
            }
        });
        
        h+='</div>';
        c.innerHTML=h;
    }
    
    function showBuildings(){
        var c=document.getElementById('content');
        if(!bld){c.innerHTML='<div style="padding:20px;text-align:center;">Loading...</div>';return;}
        
        var buildings=Object.keys(bld);
        if(buildings.length===0){c.innerHTML='No building data';return;}
        
        // Get all params from first building
        var params=Object.keys(bld[buildings[0]]).sort();
        
        var h=`<div style="margin-bottom:10px;">
            <span style="background:#333;color:#fff;padding:4px 8px;border-radius:3px;">
                Buildings: ${buildings.length} | Params: ${params.length}
            </span>
        </div>
        <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;border:1px solid #ccc;">
            <thead><tr style="background:#333;color:#fff;">
                <th style="padding:8px;text-align:left;border-right:1px solid #555;position:sticky;left:0;background:#333;">Building</th>`;
        
        // Param headers
        params.forEach(function(p){
            var n=p;
            if(p==='max_level')n='max';
            if(p==='min_level')n='min';
            if(p==='wood_factor')n='w×';
            if(p==='stone_factor')n='s×';
            if(p==='iron_factor')n='i×';
            if(p==='pop_factor')n='p×';
            if(p==='build_time')n='time';
            if(p==='build_time_factor')n='t×';
            h+=`<th style="padding:8px;text-align:center;border-right:1px solid #555;font-size:11px;" title="${p}">${n}</th>`;
        });
        
        h+='</tr></thead><tbody>';
        
        // Building rows
        buildings.forEach(function(b,i){
            var d=bld[b];
            var bg=i%2===0?'#f9f9f9':'#fff';
            
            h+=`<tr style="background:${bg}">
                <td style="padding:8px;border-right:1px solid #ddd;border-bottom:1px solid #ddd;position:sticky;left:0;background:${bg};">
                    <b>${b}</b>
                </td>`;
            
            params.forEach(function(p){
                var v=d[p]||'—';
                var disp=v;
                
                // Format values
                if(p.includes('_factor')&&!isNaN(v)){
                    disp=parseFloat(v).toFixed(2);
                }else if(p==='build_time'&&!isNaN(v)){
                    var s=parseInt(v);
                    if(s>=3600){
                        var hh=Math.floor(s/3600);
                        var mm=Math.floor((s%3600)/60);
                        disp=mm>0?`${hh}h ${mm}m`:`${hh}h`;
                    }else if(s>=60){
                        var m=Math.floor(s/60);
                        var ss=s%60;
                        disp=ss>0?`${m}m ${ss}s`:`${m}m`;
                    }else{
                        disp=`${s}s`;
                    }
                }else if(!isNaN(v)){
                    var n=parseFloat(v);
                    if(n>=1000)disp=n.toLocaleString();
                }
                
                var cellStyle='';
                if(['wood','stone','iron'].includes(p))cellStyle='background:#f9f0f0;';
                else if(p==='pop')cellStyle='background:#f0f9f0;';
                else if(p.includes('_factor'))cellStyle='background:#f0f0f9;';
                else if(p.includes('time'))cellStyle='background:#f9f9f0;';
                
                h+=`<td style="padding:8px;text-align:center;border-right:1px solid #ddd;border-bottom:1px solid #ddd;${cellStyle}">
                    ${disp}
                </td>`;
            });
            
            h+='</tr>';
        });
        
        h+='</tbody></table></div>';
        
        // Legend
        h+=`<div style="margin-top:15px;padding:10px;background:#f5f5f5;border:1px solid #ccc;border-radius:3px;font-size:11px;">
            <b>Colors:</b> 
            <span style="background:#f9f0f0;padding:2px 5px;margin:0 5px;">resources</span>
            <span style="background:#f0f9f0;padding:2px 5px;margin:0 5px;">population</span>
            <span style="background:#f0f0f9;padding:2px 5px;margin:0 5px;">factors</span>
            <span style="background:#f9f9f0;padding:2px 5px;margin:0 5px;">time</span>
        </div>`;
        
        c.innerHTML=h;
    }
    
    var h=`
        <div id="twInfo" style="position:fixed;top:20px;left:20px;right:20px;bottom:20px;
            background:#fff;border:2px solid #333;border-radius:5px;z-index:10000;box-shadow:0 0 20px #000;
            display:flex;flex-direction:column;font-family:Arial;font-size:12px;">
            <div style="background:#333;color:#fff;padding:10px;display:flex;justify-content:space-between;">
                <b>${server} - Config Info</b>
                <button onclick="document.getElementById('twInfo').remove();
                                 document.getElementById('twOverlay').remove();"
                        style="background:#666;color:#fff;border:none;padding:2px 10px;cursor:pointer;">X</button>
            </div>
            <div style="display:flex;border-bottom:1px solid #ccc;">
                <button id="btnCfg" onclick="showTab(0)" 
                    style="flex:1;background:#333;color:#fff;border:none;padding:8px;cursor:pointer;">World Config</button>
                <button id="btnBld" onclick="showTab(1)"
                    style="flex:1;background:#eee;color:#333;border:none;padding:8px;cursor:pointer;border-left:1px solid #ccc;">Buildings</button>
            </div>
            <div id="content" style="flex:1;overflow:auto;padding:10px;"></div>
        </div>
        <div id="twOverlay" style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:9999;"></div>`;
    
    document.getElementById('twInfo')?.remove();
    document.getElementById('twOverlay')?.remove();
    document.body.insertAdjacentHTML('beforeend',h);
    
    // Show config first
    setTimeout(function(){showTab(0);},100);
})();
