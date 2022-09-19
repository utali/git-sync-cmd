### 1. 全局安装git-sync-cmd，在本地需要同步的目录下执行git-sync-cmd
```javascript
npm install git-sync-cmd -g
git-sync-cmd run //同步+合并
```
### 2. 也可以在项目中安装git-sync-cmd，在本地需要同步的目录下执行npx git-sync-cmd
```javascript
npm install git-sync-cmd
npx git-sync-cmd run // 同步+合并
```
仅同步
```javascript
npx git-sync-cmd copy
```
仅合并
```javascript
npx git-sync-cmd merge
```
### 按提示输入内容进行同步