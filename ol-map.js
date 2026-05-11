// === OpenLayers 互动地图系统 ===
class OpenLayersMap {
    constructor() {
        this.initialized = false;
        this.map = null;
        this.vectorSource = null;
        this.clusterSource = null;
        this.markerLayer = null;
        this.tileLayer = null;
        this.labelLayer = null;
        this.popup = null;
        this.isDarkMode = false;
        this.allFeatures = [];
        this.mapView = null;
        this.canvasTileSource = null;
    }

    init() {
        if (this.initialized) {
            if (this.map) this.map.updateSize();
            return;
        }
        const container = document.getElementById('ol-map');
        if (!container || typeof ol === 'undefined') {
            console.warn('OpenLayers not loaded');
            return;
        }
        this.initialized = true;
        const self = this;

        // Map config
        const tileSize = 256, maxZoom = 10;
        const worldExtent = [-17000, -17000, 17000, 17000];
        const mapExtent = [-16500, -8000, 3500, 12000];
        const projection = new ol.proj.Projection({ code: 'CUSTOM', units: 'pixels', extent: worldExtent });
        const mapWidth = mapExtent[2] - mapExtent[0];
        const maxZoomRes = mapWidth / (625 * tileSize);
        const resolutions = Array.from({ length: maxZoom + 1 }, (_, z) => maxZoomRes * Math.pow(2, maxZoom - z));
        const tileGrid = new ol.tilegrid.TileGrid({ extent: mapExtent, origin: [mapExtent[0], mapExtent[3]], tileSize, resolutions });

        // Land/water/road data
        const landRegions = [
            { cx: -10000, cy: 5000, rx: 4000, ry: 3500 }, { cx: -7500, cy: 6500, rx: 2000, ry: 800 },
            { cx: -8500, cy: 4500, rx: 600, ry: 400 }, { cx: -3000, cy: 3000, rx: 6000, ry: 4000 },
            { cx: -2000, cy: 7000, rx: 4000, ry: 2000 }, { cx: -1500, cy: 8500, rx: 2500, ry: 500 },
            { cx: -500, cy: 9000, rx: 1500, ry: 400 }, { cx: -4000, cy: 500, rx: 3000, ry: 1500 },
            { cx: 500, cy: 1500, rx: 3000, ry: 2000 }, { cx: 1500, cy: 3500, rx: 2000, ry: 1500 },
        ];
        const roads = [
            { points: [[-13000,5000],[-10000,5000],[-7500,5000],[-5000,4000],[-3000,3000],[0,2000],[2000,3000],[4000,4000]] },
            { points: [[-11000,6500],[-9000,6500],[-7500,6500],[-6000,6000]] },
            { points: [[-8000,8000],[-5000,7500],[-2000,7000],[1000,6500],[3000,6000]] },
            { points: [[-6000,1000],[-4000,500],[-2000,0],[0,500]] },
            { points: [[-5000,8000],[-5000,5000],[-5000,2000],[-5000,0]] },
            { points: [[-11000,4000],[-10000,3000],[-8000,3000],[-7000,3500],[-6500,4500],[-7000,5500],[-8000,6000],[-10000,6000],[-11000,5000],[-11000,4000]] },
        ];
        const waterFeatures = [
            { cx: -2000, cy: 4000, rx: 800, ry: 400 }, { cx: 1000, cy: 5500, rx: 600, ry: 300 },
            { cx: -6000, cy: 2500, rx: 400, ry: 600 },
        ];
        const cityLabels = [
            { x: -9000, y: 5500, text: 'VICE CITY', size: 'city' }, { x: -7500, y: 6800, text: 'Vice Beach', size: 'area' },
            { x: -9500, y: 4000, text: 'Little Havana', size: 'area' }, { x: -8000, y: 3500, text: 'Little Haiti', size: 'area' },
            { x: -7000, y: 4500, text: 'Downtown', size: 'area' }, { x: -6500, y: 5500, text: 'Starfish Island', size: 'area' },
            { x: -2000, y: 3000, text: 'LEONIDA', size: 'region' }, { x: -3000, y: 1000, text: 'Grassrivers', size: 'area' },
            { x: 1000, y: 3000, text: 'Port Gellhorn', size: 'area' }, { x: -1500, y: 8500, text: 'Leonida Keys', size: 'area' },
            { x: -4000, y: 7000, text: 'Sundown', size: 'area' }, { x: -500, y: 1500, text: 'Ambrosia', size: 'area' },
            { x: -9500, y: 5500, text: 'Airport', size: 'area' },
        ];

        function isLandAt(x, y) { return landRegions.some(r => { const dx=(x-r.cx)/r.rx, dy=(y-r.cy)/r.ry; return dx*dx+dy*dy<=1; }); }
        function isWaterAt(x, y) { return waterFeatures.some(w => { const dx=(x-w.cx)/w.rx, dy=(y-w.cy)/w.ry; return dx*dx+dy*dy<=1; }); }
        function isNearRoad(x, y, thr) { return roads.some(road => { for(let i=0;i<road.points.length-1;i++){const[x1,y1]=road.points[i],[x2,y2]=road.points[i+1];const dx=x2-x1,dy=y2-y1,l2=dx*dx+dy*dy;if(!l2)continue;let t=((x-x1)*dx+(y-y1)*dy)/l2;t=Math.max(0,Math.min(1,t));const px=x1+t*dx,py=y1+t*dy,d=Math.sqrt((x-px)**2+(y-py)**2);if(d<thr)return true;}return false;}); }
        function seededRandom(x,y){let h=x*374761393+y*668265263+1274126177;h=(h^(h>>13))*1274126177;h=h^(h>>16);return(h&0x7fffffff)/0x7fffffff;}

        function drawMapTile(canvas, z, x, y) {
            const ctx = canvas.getContext('2d'), w = canvas.width, h = canvas.height;
            const res = resolutions[z];
            const x0 = mapExtent[0]+x*tileSize*res, y0 = mapExtent[3]-y*tileSize*res;
            const x1 = x0+tileSize*res, y1 = y0-tileSize*res;
            const stepX=(x1-x0)/w, stepY=(y0-y1)/h;
            const imageData = ctx.createImageData(w, h), data = imageData.data;
            for(let py=0;py<h;py++) for(let px=0;px<w;px++){
                const wx=x0+px*stepX, wy=y0-py*stepY, idx=(py*w+px)*4;
                const land=isLandAt(wx,wy), water=isWaterAt(wx,wy), nearRoad=isNearRoad(wx,wy,80+z*15);
                const noise=seededRandom(Math.floor(wx/200),Math.floor(wy/200));
                let r,g,b;
                if(!land){r=self.isDarkMode?8+noise*8:25+noise*15;g=self.isDarkMode?15+noise*10:60+noise*20;b=self.isDarkMode?35+noise*15:120+noise*25;}
                else if(water){r=self.isDarkMode?12+noise*8:35+noise*15;g=self.isDarkMode?22+noise*10:80+noise*20;b=self.isDarkMode?45+noise*15:140+noise*20;}
                else if(nearRoad){r=self.isDarkMode?45+noise*15:160+noise*20;g=self.isDarkMode?48+noise*15:155+noise*20;b=self.isDarkMode?55+noise*15:140+noise*20;}
                else{if(self.isDarkMode){r=22+noise*12;g=28+noise*12;b=22+noise*10;}else{const dfc=Math.sqrt(wx*wx+wy*wy)/10000;r=70+noise*25;g=90+dfc*20+noise*30;b=55+noise*20;}}
                data[idx]=Math.min(255,Math.max(0,Math.round(r)));data[idx+1]=Math.min(255,Math.max(0,Math.round(g)));data[idx+2]=Math.min(255,Math.max(0,Math.round(b)));data[idx+3]=255;
            }
            ctx.putImageData(imageData,0,0);
            if(z>=3){ctx.strokeStyle=self.isDarkMode?'rgba(70,75,85,0.6)':'rgba(180,175,160,0.5)';ctx.lineWidth=z>=5?2:1;ctx.beginPath();roads.forEach(road=>{for(let i=0;i<road.points.length-1;i++){const[rx1,ry1]=road.points[i],[rx2,ry2]=road.points[i+1];const sx=((rx1-x0)/(x1-x0))*w,sy=((y0-ry1)/(y0-y1))*h,ex=((rx2-x0)/(x1-x0))*w,ey=((y0-ry2)/(y0-y1))*h;ctx.moveTo(sx,sy);ctx.lineTo(ex,ey);}});ctx.stroke();}
        }

        const tileBaseUrl = 'https://gtadb.net/map-assets/gta-6-karte';
        this.colourTileSource = new ol.source.XYZ({ url: tileBaseUrl + '/tiles-colour/{z}/{x}/{y}.png', tileGrid, projection, wrapX: false, transition: 0 });
        this.blackTileSource = new ol.source.XYZ({ url: tileBaseUrl + '/tiles-black/{z}/{x}/{y}.png', tileGrid, projection, wrapX: false, transition: 0 });
        this.canvasTileSource = this.colourTileSource;
        this.tileLayer = new ol.layer.Tile({ source: this.canvasTileSource, preload: 2 });

        const initialCenter = [(mapExtent[0]+mapExtent[2])/2, (mapExtent[1]+mapExtent[3])/2];
        this.mapView = new ol.View({ projection, center: initialCenter, zoom: 2, minZoom: 0, maxZoom, resolutions, extent: worldExtent, constrainResolution: true, constrainOnlyCenter: true, enableRotation: false });

        // Popup
        const popupEl = document.createElement('div'); popupEl.className='ol-popup'; popupEl.id='ol-popup'; popupEl.innerHTML='<div id="ol-popup-content"></div>';
        container.appendChild(popupEl);
        this.popup = new ol.Overlay({ element: popupEl, positioning: 'bottom-center', stopEvent: true, offset: [0,-20] });

        this.map = new ol.Map({
            target: 'ol-map', layers: [this.tileLayer], view: this.mapView,
            controls: ol.control.defaults.defaults({ zoom: false, rotate: false, attribution: false }),
            overlays: [this.popup]
        });

        // Labels
        const labelFeatures = cityLabels.map(l => new ol.Feature({ geometry: new ol.geom.Point([l.x,l.y]), labelText: l.text, labelSize: l.size }));
        this.labelLayer = new ol.layer.Vector({
            source: new ol.source.Vector({ features: labelFeatures }),
            style: function(f) {
                const s=f.get('labelSize');let fs,fc,fw;
                if(s==='city'){fs=20;fc='rgba(255,255,255,0.9)';fw='900';}
                else if(s==='region'){fs=14;fc='rgba(255,255,255,0.6)';fw='700';}
                else{fs=11;fc='rgba(255,255,255,0.45)';fw='600';}
                return new ol.style.Style({ text: new ol.style.Text({ text:f.get('labelText'), font:fw+' '+fs+'px Orbitron,sans-serif', fill:new ol.style.Fill({color:fc}), stroke:new ol.style.Stroke({color:'rgba(0,0,0,0.7)',width:3}), textAlign:'center', textBaseline:'middle' }) });
            }, declutter: true
        });
        this.map.addLayer(this.labelLayer);
        this.labelLayer.setVisible(false);

        // Grid
        const gridMin=-16000,gridMax=6000,gridStep=2000;
        const minorF=[],majorF=[];
        for(let gx=gridMin;gx<=gridMax;gx+=gridStep){const f=new ol.Feature({geometry:new ol.geom.LineString([[gx,gridMin],[gx,gridMax]])});(gx===0?majorF:minorF).push(f);}
        for(let gy=gridMin;gy<=gridMax;gy+=gridStep){const f=new ol.Feature({geometry:new ol.geom.LineString([[gridMin,gy],[gridMax,gy]])});(gy===0?majorF:minorF).push(f);}
        this.map.addLayer(new ol.layer.Vector({source:new ol.source.Vector({features:minorF}),style:new ol.style.Style({stroke:new ol.style.Stroke({color:'rgba(255,255,255,0.06)',width:1})})}));
        this.map.addLayer(new ol.layer.Vector({source:new ol.source.Vector({features:majorF}),style:new ol.style.Style({stroke:new ol.style.Stroke({color:'rgba(255,255,255,0.15)',width:2})})}));

        // Markers
        const markerColors = {
            landscape:{normal:'rgba(255,68,68,0.85)',hover:'rgba(255,68,68,1)',cluster:'rgba(255,68,68,0.9)'},
            trailer:{normal:'rgba(181,56,183,0.85)',hover:'rgba(181,56,183,1)',cluster:'rgba(181,56,183,0.9)'},
            leak:{normal:'rgba(0,180,255,0.85)',hover:'rgba(0,180,255,1)',cluster:'rgba(0,180,255,0.9)'},
            screenshot:{normal:'rgba(255,215,0,0.85)',hover:'rgba(255,215,0,1)',cluster:'rgba(255,215,0,0.9)'}
        };
        self.markerColors = markerColors;

        this.vectorSource = new ol.source.Vector({ features: [] });
        this.clusterSource = new ol.source.Cluster({ distance: 35, minDistance: 14, source: this.vectorSource });

        const isTouchDevice = window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
        const markerRadius = isTouchDevice ? 8 : 5;
        const markerHoverRadius = isTouchDevice ? 10 : 8;
        const hitTolerance = isTouchDevice ? 14 : 5;

        function createClusterStyle(size, kind) {
            const c = (markerColors[kind]||markerColors.landscape).cluster;
            return new ol.style.Style({ image: new ol.style.Circle({ radius: size<10?14:size<50?18:22, fill:new ol.style.Fill({color:c}), stroke:new ol.style.Stroke({color:'#fff',width:3}) }), text: new ol.style.Text({ text:String(size), fill:new ol.style.Fill({color:'#fff'}), stroke:new ol.style.Stroke({color:'rgba(0,0,0,0.35)',width:2}) }) });
        }
        const clusterStyleCache = {};

        this.markerLayer = new ol.layer.Vector({
            source: this.clusterSource,
            style: function(feature) {
                const features = feature.get('features'); const size = features.length;
                if(size===1) return features[0].getStyle() || features[0].get('customStyle');
                const allSame = features.every(function(f){return f.get('type')===features[0].get('type');});
                const kind = allSame ? features[0].get('type') : 'landscape';
                const key = kind+'_'+size;
                if(!clusterStyleCache[key]) clusterStyleCache[key] = createClusterStyle(size, kind);
                return clusterStyleCache[key];
            }
        });
        this.map.addLayer(this.markerLayer);

        // Load markers
        fetch('data/markers.json').then(function(r){return r.json();}).then(function(data){
            var markers = Array.isArray(data.markers)?data.markers:[];
            markers.forEach(function(m) {
                if(m.map_x==null||m.map_y==null) return;
                var type = ['landscape','trailer','leak','screenshot'].includes(m.type)?m.type:'landscape';
                var colors = markerColors[type];
                var normalStyle = new ol.style.Style({ image: new ol.style.Circle({ radius: markerRadius, fill:new ol.style.Fill({color:colors.normal}), stroke:new ol.style.Stroke({color:'#fff',width:2}) }) });
                var hoverStyle = new ol.style.Style({ image: new ol.style.Circle({ radius: markerHoverRadius, fill:new ol.style.Fill({color:colors.hover}), stroke:new ol.style.Stroke({color:'#fff',width:3}) }) });
                var f = new ol.Feature({ geometry: new ol.geom.Point([parseFloat(m.map_x),parseFloat(m.map_y)]), id:m.id, name:m.title||'', description:m.description||'', type:type, region:m.region||'', map_x:m.map_x, map_y:m.map_y });
                f.set('customStyle', normalStyle); f.set('hoverStyle', hoverStyle); f.setStyle(normalStyle);
                self.allFeatures.push(f);
            });
            self.vectorSource.clear(true);
            self.vectorSource.addFeatures(self.allFeatures);
        }).catch(function(e){console.error('Markers load failed:',e);});

        // Tooltip
        var tooltipEl = document.getElementById('ol-marker-tooltip');
        var tooltipOverlay = new ol.Overlay({ element:tooltipEl, offset:[0,-12], positioning:'bottom-center', stopEvent:false });
        this.map.addOverlay(tooltipOverlay);
        var hoveredFeature = null;

        var typeLabels = { landscape:'景观地标', trailer:'预告片', leak:'泄露内容', screenshot:'官方截图' };
        var typeIcons = { landscape:'fa-mountain', trailer:'fa-film', leak:'fa-user-secret', screenshot:'fa-camera' };

        function buildPopupContent(feature) {
            var name=feature.get('name')||'未知', desc=feature.get('description')||'', type=feature.get('type')||'landscape', region=feature.get('region')||'';
            var mx=feature.get('map_x'),my=feature.get('map_y'), cx=mx!=null?Math.round(Number(mx)):'--', cy=my!=null?Math.round(Number(my)):'--';
            var tl=typeLabels[type]||type, ti=typeIcons[type]||'fa-map-marker-alt';
            var pc = document.getElementById('ol-popup-content');
            if(pc) pc.innerHTML = '<div class="popup-header"><div class="popup-type-badge '+type+'"><i class="fas '+ti+'"></i> '+tl+'</div><button class="popup-close" onclick="document.getElementById(\'ol-popup\').style.display=\'none\'"><i class="fas fa-times"></i></button></div><div class="popup-title">'+name+'</div><div class="popup-body">'+(desc?'<div class="popup-description">'+desc+'</div>':'')+'<div class="popup-meta">'+(region?'<div class="popup-meta-item"><i class="fas fa-map-marker-alt"></i> '+region+'</div>':'')+'<div class="popup-meta-item"><i class="fas fa-crosshairs"></i> X: '+cx+' | Y: '+cy+'</div></div></div><div class="popup-footer"><span class="popup-coords">'+cx+', '+cy+'</span></div>';
            self.popup.setPosition(feature.getGeometry().getCoordinates());
        }

        // Click handler
        this.map.on('click', function(evt) {
            var clicked = self.map.forEachFeatureAtPixel(evt.pixel, function(f,l){return l===self.markerLayer?f:null;}, {hitTolerance:hitTolerance, layerFilter:function(l){return l===self.markerLayer;}});
            if(!clicked){self.popup.setPosition(undefined);return;}
            var clustered = clicked.get('features');
            if(clustered&&clustered.length>1){var ext=ol.extent.createEmpty();clustered.forEach(function(f){ol.extent.extend(ext,f.getGeometry().getExtent());});self.map.getView().fit(ext,{padding:[80,80,80,80],duration:300,maxZoom:7});return;}
            var feature = clustered?clustered[0]:clicked;
            if(feature) buildPopupContent(feature);
        });

        // Hover (desktop)
        if(!isTouchDevice) {
            this.map.on('pointermove', function(evt) {
                if(evt.dragging){tooltipOverlay.setPosition(undefined);if(tooltipEl)tooltipEl.style.display='none';if(hoveredFeature){hoveredFeature.setStyle(hoveredFeature.get('customStyle'));hoveredFeature=null;}return;}
                var feature = self.map.forEachFeatureAtPixel(evt.pixel, function(f){return f&&f.getStyle()?f:null;}, {hitTolerance:hitTolerance});
                if(hoveredFeature&&hoveredFeature!==feature){hoveredFeature.setStyle(hoveredFeature.get('customStyle'));hoveredFeature=null;}
                if(feature){if(hoveredFeature!==feature){feature.setStyle(feature.get('hoverStyle')||feature.get('customStyle'));hoveredFeature=feature;}if(tooltipEl){tooltipEl.innerHTML=feature.get('name')||'未命名';tooltipEl.style.display='block';}tooltipOverlay.setPosition(evt.coordinate);self.map.getTargetElement().style.cursor='pointer';}
                else{tooltipOverlay.setPosition(undefined);if(tooltipEl)tooltipEl.style.display='none';self.map.getTargetElement().style.cursor='';}
            });
        }

        // Mouse coords
        this.map.on('pointermove', function(evt){if(evt.coordinate){var el=document.getElementById('ol-mouse-coords');if(el)el.textContent='X: '+Math.round(evt.coordinate[0])+' | Y: '+Math.round(evt.coordinate[1]);}});

        // Search
        var searchInput = document.getElementById('ol-search-input');
        var searchResults = document.getElementById('ol-search-results');
        if(searchInput && searchResults) {
            searchInput.addEventListener('input', function() {
                var q = this.value.toLowerCase().trim();
                searchResults.innerHTML = '';
                if(!q){searchResults.classList.remove('show');return;}
                var matches = self.allFeatures.filter(function(f) {
                    var n=(f.get('name')||'').toLowerCase(), d=(f.get('description')||'').toLowerCase(), r=(f.get('region')||'').toLowerCase();
                    var mx=f.get('map_x'),my=f.get('map_y'), cs=mx!=null?(Math.round(mx)+' '+Math.round(my)):'';
                    return n.includes(q)||d.includes(q)||r.includes(q)||cs.includes(q);
                });
                if(!matches.length){searchResults.innerHTML='<li class="ol-search-result-item" style="justify-content:center;color:rgba(255,255,255,0.4);">没有找到结果</li>';searchResults.classList.add('show');return;}
                matches.slice(0,20).forEach(function(f) {
                    var n=f.get('name')||'未命名', t=f.get('type')||'landscape', rg=f.get('region')||'';
                    var c=markerColors[t]||markerColors.landscape;
                    var li=document.createElement('li'); li.className='ol-search-result-item';
                    li.innerHTML='<div class="ol-search-result-dot" style="background:'+c.normal+'"></div><div class="ol-search-result-info"><div class="ol-search-result-name">'+n+'</div>'+(rg?'<div class="ol-search-result-region">'+rg+'</div>':'')+'</div>';
                    li.addEventListener('click', function(){self.mapView.animate({center:f.getGeometry().getCoordinates(),zoom:6,duration:400});buildPopupContent(f);searchResults.classList.remove('show');searchInput.value='';});
                    searchResults.appendChild(li);
                });
                searchResults.classList.add('show');
            });
            document.addEventListener('click', function(e){if(!e.target.closest('.ol-search-box'))searchResults.classList.remove('show');});
        }

        // Filter system
        document.querySelectorAll('.ol-filter-bar input[data-type]').forEach(function(cb) {
            cb.addEventListener('change', function() {
                var checks = {};
                document.querySelectorAll('.ol-filter-bar input[data-type]').forEach(function(c) { checks[c.dataset.type] = c.checked; });
                var visible = self.allFeatures.filter(function(f) { var t=f.get('type'); return checks[t]!==false; });
                self.vectorSource.clear(true);
                self.vectorSource.addFeatures(visible);
                self.markerLayer.changed();
            });
        });

        // Style toggle
        var colourBtn = document.getElementById('ol-style-colour');
        var darkBtn = document.getElementById('ol-style-dark');
        if(colourBtn) colourBtn.addEventListener('click', function(){ self.isDarkMode=false; self.tileLayer.setSource(self.colourTileSource); this.classList.add('active'); if(darkBtn)darkBtn.classList.remove('active'); });
        if(darkBtn) darkBtn.addEventListener('click', function(){ self.isDarkMode=true; self.tileLayer.setSource(self.blackTileSource); this.classList.add('active'); if(colourBtn)colourBtn.classList.remove('active'); });

        // Map controls
        var zi = document.getElementById('ol-zoom-in'), zo = document.getElementById('ol-zoom-out'), rv = document.getElementById('ol-reset-view');
        if(zi) zi.addEventListener('click', function(){ self.mapView.animate({zoom:self.mapView.getZoom()+1,duration:200}); });
        if(zo) zo.addEventListener('click', function(){ self.mapView.animate({zoom:self.mapView.getZoom()-1,duration:200}); });
        if(rv) rv.addEventListener('click', function(){ self.mapView.animate({center:initialCenter,zoom:2,duration:400}); self.popup.setPosition(undefined); });

        // Resize
        window.addEventListener('resize', function(){ if(self.map) self.map.updateSize(); });

        console.log('OpenLayers interactive map initialized');
    }
}
