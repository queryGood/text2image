document.addEventListener('DOMContentLoaded', () => {
    // DOM 元素引用
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const textInput = document.getElementById('textInput');
    const generateBtn = document.getElementById('generateBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const fontSizeInput = document.getElementById('fontSize');
    const textColorInput = document.getElementById('textColor');
    const color1Input = document.getElementById('color1');
    const color2Input = document.getElementById('color2');
    const randomBgBtn = document.getElementById('randomBg');
  
    // 默认配置
    let currentSettings = {
      fontSize: '56',
      textColor: '#ffffff',
      color1: '#0984e3',
      color2: '#6c5ce7'
    };
  
    // 生成随机颜色
    function getRandomColor() {
      return `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`;
    }
  
    // 初始化画布
    function initCanvas() {
      ctx.fillStyle = '#2d3436';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  
    // 加载用户设置
    function loadSettings() {
      chrome.storage.sync.get(Object.keys(currentSettings), (settings) => {
        currentSettings = { 
          ...currentSettings,
          ...settings,
          fontSize: Math.min(120, Math.max(24, settings.fontSize || 56)) // 限制范围
        };
        
        // 更新UI控件状态
        fontSizeInput.value = currentSettings.fontSize;
        textColorInput.value = currentSettings.textColor;
        color1Input.value = currentSettings.color1;
        color2Input.value = currentSettings.color2;
        
        generateCover('Tech Cover Generator'); 
      });
    }
  
    // 保存设置
    function saveSetting(key, value) {
      currentSettings[key] = value;
      chrome.storage.sync.set({ [key]: value });
    }
  
    // 生成渐变背景
    function createGradient() {
      try {
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, currentSettings.color1);
        gradient.addColorStop(1, currentSettings.color2);
        return gradient;
      } catch (error) {
        console.error('渐变创建失败:', error);
        return '#2d3436';
      }
    }
  
    // 文字换行处理
    function wrapText(text, x, y, maxWidth, lineHeight, maxLines = 3) {
        const paragraphs = text.split('\n');
        const allLines = [];
        
        // 第一阶段：计算所有行
        paragraphs.forEach(paragraph => {
          let currentLine = '';
          const words = paragraph.split(/(\s+)/g).filter(w => w !== '');
          
          words.forEach(word => {
            const testLine = currentLine + word;
            const metrics = ctx.measureText(testLine);
            
            if (metrics.width > maxWidth && currentLine !== '') {
              allLines.push(currentLine.trim());
              currentLine = word;
            } else {
              currentLine = testLine;
            }
          });
          
          if (currentLine.trim() !== '') {
            allLines.push(currentLine.trim());
          }
        });
      
        // 限制最大行数
        const displayLines = allLines.slice(0, maxLines);
        const totalHeight = displayLines.length * lineHeight;
        
        // 计算垂直居中起始位置
        const startY = y - totalHeight / 2 + lineHeight / 2;
      
        // 第二阶段：实际绘制
        displayLines.forEach((line, index) => {
          const lineY = startY + (index * lineHeight);
          ctx.fillText(line, x, lineY);
        });
      
        // 添加省略号（如果有截断）
        if (allLines.length > maxLines) {
          ctx.fillText('...', x, startY + (maxLines * lineHeight));
        }
      }
  
    // 生成封面主逻辑
    function generateCover(text) {
      if (!text) return;
  
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // 绘制背景
      ctx.fillStyle = createGradient();
      ctx.fillRect(0, 0, canvas.width, canvas.height);
  
      // 文字样式配置
      ctx.fillStyle = currentSettings.textColor;
      ctx.font = `bold ${currentSettings.fontSize}px "Segoe UI", sans-serif`;
      ctx.textAlign = 'center';
  
      // 主标题文字
      wrapText(
        text,
        canvas.width / 2,    // X居中
        canvas.height / 2,   // Y基准线
        canvas.width - 80,   // 最大宽度
        parseInt(currentSettings.fontSize) * 1.5 // 行间距
      );
  
      // 水印文字
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.font = '18px "Courier New", monospace';
      ctx.fillText('techcover.autogen', canvas.width - 110, canvas.height - 25);
  
      downloadBtn.disabled = false;
    }
  
    // 事件监听
    // 字体大小输入
    fontSizeInput.addEventListener('input', debounce((e) => {
      const size = Math.min(120, Math.max(24, e.target.value || 56));
      e.target.value = size; // 强制有效值
      saveSetting('fontSize', size.toString());
      generateCover(textInput.value.trim());
    }, 500));
  
    // 颜色设置
    [textColorInput, color1Input, color2Input].forEach(input => {
      input.addEventListener('input', (e) => {
        saveSetting(e.target.id, e.target.value);
        generateCover(textInput.value.trim());
      });
    });
  
    // 随机背景按钮
    randomBgBtn.addEventListener('click', () => {
      const newColor1 = getRandomColor();
      const newColor2 = getRandomColor();
      
      color1Input.value = newColor1;
      color2Input.value = newColor2;
      
      saveSetting('color1', newColor1);
      saveSetting('color2', newColor2);
      
      generateCover(textInput.value.trim());
    });
  
    // 生成按钮
    generateBtn.addEventListener('click', () => {
      const text = textInput.value.trim();
      if (text) generateCover(text);
    });
  
    // 下载按钮
    downloadBtn.addEventListener('click', () => {
      const link = document.createElement('a');
      link.download = `cover-${Date.now()}.png`;
      link.href = canvas.toDataURL();
      link.click();
    });
  
    // 初始化流程
    initCanvas();
    loadSettings();
  });
  
  // 防抖函数
  function debounce(func, delay) {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), delay);
    };
  }