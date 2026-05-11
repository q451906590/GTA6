#!/bin/bash

# GTA6 攻略网站启动脚本

echo "=================================="
echo "   GTA6 攻略指南网站启动器"
echo "=================================="
echo ""

# 检查是否安装了Python
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
else
    echo "错误: 未找到Python，请先安装Python"
    exit 1
fi

# 获取脚本所在目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# 默认端口
PORT=${1:-8000}

echo "正在启动本地服务器..."
echo "访问地址: http://localhost:$PORT"
echo ""
echo "按 Ctrl+C 停止服务器"
echo ""

# 启动Python HTTP服务器
$PYTHON_CMD -m http.server $PORT

# 如果Python服务器启动失败，尝试使用Node.js
if [ $? -ne 0 ]; then
    echo ""
    echo "Python服务器启动失败，尝试使用Node.js..."
    
    if command -v node &> /dev/null; then
        npx http-server -p $PORT
    else
        echo "错误: 无法启动服务器，请手动打开 index.html 文件"
        exit 1
    fi
fi
