<template>
  <el-dialog v-model="visible" title="图片管理" width="80%">
    <el-upload
      class="upload-demo"
      :action="uploadUrl"
      :headers="headers"
      :on-success="handleUploadSuccess"
      accept="image/*"
      :before-upload="beforeUpload"
      multiple
      :limit="10"
      :file-list="fileList"
    >
      <el-button type="primary">点击上传</el-button>
      <template #tip>
        <div class="el-upload__tip">只能上传图片文件，支持多选</div>
      </template>
    </el-upload>

    <div class="image-list">
      <div v-for="(image, index) in tempImages" :key="index" class="image-item">
        <el-image
          style="width: 150px; height: 150px"
          :src="image.url"
          :preview-src-list="[image.url]"
        >
          <template #placeholder>
            <div class="image-placeholder">加载中...</div>
          </template>
        </el-image>
        <p>临时文件名: {{ image.tempFileName }}</p>
      </div>
    </div>

    <div v-if="uploadData.文件编号" class="received-data">
      <p>接收到的文件编号: {{ uploadData.文件编号 }}</p>
    </div>

    <template #footer>
      <el-button @click="submitPhotos">提交</el-button>
      <el-button type="danger" @click="cancelUpload">取消</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import axios from 'axios';
import { ElMessage } from 'element-plus';

const props = defineProps({
  visible: Boolean,
  fileNumber: String
});

const emit = defineEmits(['update:visible']);

const visible = ref(false);
const uploadUrl = 'http://localhost:3000/api/photos/upload-temp';
const headers = { 'Authorization': 'Bearer ' + localStorage.getItem('token') }; // 如果需要身份验证
const uploadData = ref({ 文件编号: '' });
const tempImages = ref<any[]>([]);
const fileList = ref<any[]>([]);

// 打印接收到的 visible 值
watch(() => props.visible, (newValue) => {
  console.log('props.visible changed to:', newValue);
  visible.value = newValue;
  if (newValue && props.fileNumber) {
    uploadData.value.文件编号 = props.fileNumber;
    console.log('设置文件编号为:', props.fileNumber);
  }
});

watch(visible, (newValue) => {
  console.log('visible changed to:', newValue);
  emit('update:visible', newValue);
});

const beforeUpload = (file: any) => {
  console.log('beforeUpload called with file:', file);
  const isImage = file.type.startsWith('image/');
  if (!isImage) {
    ElMessage.error('只能上传图片文件');
    return false;
  }
  return true;
};

const handleUploadSuccess = (response: any, file: any) => {
  console.log('后端返回的数据:', response); // 打印后端返回的完整数据
  if (response.success) {
    ElMessage.success('上传成功');
    // 遍历后端返回的数组
    response.data.forEach((item: any) => {
      console.log("item.url", item.url);
      const newImage = {
        url: item.url,
        tempFileName: item.tempFileName
      };
      console.log('更新后的 newImage:', newImage);
      // 使用展开运算符确保响应式更新
      tempImages.value = [...tempImages.value, newImage];
      console.log('更新后的 tempImages:', tempImages.value);
    });
  } else {
    ElMessage.error('上传失败');
  }
};

const submitPhotos = async () => {
  console.log('submitPhotos called');
  if (tempImages.value.length === 0) {
    ElMessage.error('没有可提交的图片');
    return;
  }

  try {
    const fileNumber = uploadData.value.文件编号;
    const tempFileNames = tempImages.value.map(image => image.tempFileName);
    console.log('准备提交的文件编号:', fileNumber, '临时文件名:', tempFileNames);

    // 确保 tempFileNames 是有效的数组
    if (!Array.isArray(tempFileNames) || tempFileNames.length === 0) {
      ElMessage.error('没有可提交的图片');
      return;
    }

    const response = await axios.post('http://localhost:3000/api/photos/submit', {
      fileNumber,
      tempFileNames
    });

    console.log('提交响应:', response);
    if (response.data.success) {
      ElMessage.success('提交成功');
      tempImages.value = [];
      fileList.value = [];
      visible.value = false; // 提交成功后关闭对话框
      console.log('清空 tempImages 和 fileList，并关闭对话框');
    } else {
      ElMessage.error('提交失败');
    }
  } catch (error) {
    console.error('提交图片时出错:', error);
    ElMessage.error('提交失败');
  }
};

const cancelUpload = async () => {
  console.log('cancelUpload called');
  if (tempImages.value.length === 0) {
    visible.value = false;
    return;
  }

  try {
    const tempFileNames = tempImages.value.map(image => image.tempFileName);
    console.log('准备取消上传的临时文件名:', tempFileNames);

    await axios.post('http://localhost:3000/api/photos/cancel', {
      tempFileNames
    });

    ElMessage.success('取消上传成功');
    tempImages.value = [];
    fileList.value = [];
    visible.value = false;
    console.log('清空 tempImages 和 fileList，并关闭对话框');
  } catch (error) {
    console.error('取消上传时出错:', error);
    ElMessage.error('取消上传失败');
  }
};
</script>

<style scoped>
.image-list {
  display: flex;
  flex-wrap: wrap;
  margin-top: 20px;
}

.image-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 10px;
}

.received-data {
  margin-top: 20px;
  padding: 10px;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.image-placeholder {
  width: 150px;
  height: 150px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f0f0f0;
  border-radius: 4px;
}
</style>