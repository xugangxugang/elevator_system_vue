<template>
  <div class="maintenance-management">
    <el-card>
      <template #header>
        <h1>电梯维保单登记管理</h1>
      </template>
      
      <el-row>
        <el-col :span="24" class="btn-container">
          <!-- 搜索功能 -->
          <el-input
            v-model="searchQuery"
            placeholder="输入设备代码、使用单位、维保人员搜索"
            style="width: 300px; margin-right: 10px;"
            clearable
          />
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>

          <el-button type="primary" @click="addSingleItem" style="margin-left: 20px;">单个添加</el-button>
          <el-button type="primary" @click="addBatchItem">批量添加</el-button>
          <el-button type="danger" @click="deleteSelectedItems">多选删除</el-button>
          <el-button type="danger" @click="deleteAllItems">批量删除</el-button>
           <!-- 新增导出所有数据按钮 -->
           <el-button type="success" @click="exportAllData">导出所有数据</el-button>
        
        </el-col>
      </el-row>
      
      <el-row>
        <el-table
          ref="multipleTableRef"
          :data="tableData"
          style="width: 100%"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="ID" label="ID" width="80" />
          <el-table-column prop="使用单位" label="使用单位" width="200" />
          <el-table-column prop="设备编号" label="设备编号" width="200" />
          <el-table-column prop="设备代码" label="设备代码" width="200" />
          <el-table-column prop="出厂编号" label="出厂编号" width="200" />
          <el-table-column prop="维保类型" label="维保类型" width="150" />
          <el-table-column prop="维保时长" label="维保时长" width="150" />
          <el-table-column prop="开始时间" label="开始时间" width="180">
            <template #default="scope">
              {{ formatDate(scope.row.开始时间) }}
            </template>
          </el-table-column>
          <el-table-column prop="结束时间" label="结束时间" width="180">
            <template #default="scope">
              {{ formatDate(scope.row.结束时间) }}
            </template>
          </el-table-column>
          <el-table-column prop="维保人员" label="维保人员" width="150" />
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="scope">
              <el-button size="small" @click="editItem(scope.row)">编辑</el-button>
              <el-button size="small" type="danger" @click="deleteItem(scope.row.ID)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-row>
      
      <el-row>
        <el-pagination
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          :current-page="currentPage"
          :page-sizes="[10, 20, 30]"
          :page-size="pageSize"
          layout="total, sizes, prev, pager, next, jumper"
          :total="totalCount"
        />
      </el-row>
      
      <!-- 添加/编辑对话框 -->
      <el-dialog v-model="dialogVisible" :title="dialogTitle">
        <el-form ref="formRef" :model="form" label-width="120px">
          <el-form-item label="使用单位">
            <el-input v-model="form.使用单位" />
          </el-form-item>
          <el-form-item label="设备编号">
            <el-input v-model="form.设备编号" />
          </el-form-item>
          <el-form-item label="设备代码">
            <el-input v-model="form.设备代码" />
          </el-form-item>
          <el-form-item label="出厂编号">
            <el-input v-model="form.出厂编号" />
          </el-form-item>
          <el-form-item label="维保类型">
            <el-input v-model="form.维保类型" />
          </el-form-item>
          <el-form-item label="维保时长">
            <el-input v-model="form.维保时长" />
          </el-form-item>
          <el-form-item label="开始时间">
            <el-date-picker v-model="form.开始时间" type="date" placeholder="选择开始时间" />
          </el-form-item>
          <el-form-item label="结束时间">
            <el-date-picker v-model="form.结束时间" type="date" placeholder="选择结束时间" />
          </el-form-item>
          <el-form-item label="维保人员">
            <el-input v-model="form.维保人员" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveItem">保存</el-button>
        </template>
      </el-dialog>
      
      <!-- 批量导入对话框 -->
      <el-dialog v-model="uploadDialogVisible" title="批量导入">
        <el-upload
          class="upload-demo"
          drag
          :action="`${apiBaseUrl}/api/EquipmentMaintenanceOrder/import`"
          :on-success="handleUploadSuccess"
          :on-error="handleUploadError"
          :on-progress="handleUploadProgress"
          :headers="headers"
        >
          <i class="el-icon-upload"></i>
          <div class="el-upload__text">拖拽文件到此处或 <em>点击上传</em></div>
          <el-progress v-if="uploadProgress || uploadStatus" :percentage="uploadProgress" :status="uploadStatus" />
        </el-upload>
      </el-dialog>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { ElMessage } from 'element-plus';

const apiBaseUrl = 'http://localhost:3000';
const headers = ref({
  Authorization: 'Bearer ' + localStorage.getItem('token')
});

interface MaintenanceRecord {
  ID: number;
  使用单位: string;
  设备编号: string;
  设备代码: string;
  出厂编号: string;
  维保类型: string;
  维保时长: string;
  开始时间: string;
  结束时间: string;
  维保人员: string;
}

// 表格相关数据
const tableData = ref<MaintenanceRecord[]>([]);
const multipleTableRef = ref();
const multipleSelection = ref<MaintenanceRecord[]>([]);
const currentPage = ref(1);
const pageSize = ref(10);
const totalCount = ref(0);

// 搜索的是时候用的查询条件
const searchQuery = ref('');

// 对话框相关数据
const dialogVisible = ref(false);
const uploadDialogVisible = ref(false);
const dialogTitle = ref('');
const form = ref<MaintenanceRecord>({
  ID: 0,
  使用单位: '',
  设备编号: '',
  设备代码: '',
  出厂编号: '',
  维保类型: '',
  维保时长: '',
  开始时间: '',
  结束时间: '',
  维保人员: ''
});

// 上传相关数据
const uploadProgress = ref(0);
const uploadStatus = ref('');
const file = ref<File | null>(null);

// 初始化获取数据
const fetchData = async (query?: string) => {
  try {
    const queryParams = {
      page: currentPage.value,
      limit: pageSize.value,
      ...(query ? { q: query } : {})
    };

    const response = await axios.get(`${apiBaseUrl}/api/EquipmentMaintenanceOrder`, {
      params: queryParams
    });
    tableData.value = response.data.data;
    totalCount.value = response.data.totalCount;
  } catch (error) {
    console.error('获取数据失败', error);
    ElMessage.error('获取数据失败');
  }
};

// 切换页面时获取数据
const handleCurrentChange = (val: number) => {
  currentPage.value = val;
  fetchData(searchQuery.value);
};

// 切换每页显示条数时获取数据
const handleSizeChange = (val: number) => {
  pageSize.value = val;
  fetchData(searchQuery.value);
};

// 选择框选择项变化时触发
const handleSelectionChange = (val: MaintenanceRecord[]) => {
  multipleSelection.value = val;
};

// 日期格式化
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
};

// 搜索一份条目的对话框
const addSingleItem = () => {
  dialogTitle.value = '单个添加';
  form.value = {
    ID: 0,
    使用单位: '',
    设备编号: '',
    设备代码: '',
    出厂编号: '',
    维保类型: '',
    维保时长: '',
    开始时间: '',
    结束时间: '',
    维保人员: ''
  };
  dialogVisible.value = true;
};

// 打开批量添加对话框
const addBatchItem = () => {
  uploadDialogVisible.value = true;
};

// 批量导入成功
const handleUploadSuccess = () => {
  uploadDialogVisible.value = false;
  fetchData(searchQuery.value);
  ElMessage.success('批量导入成功');
};

// 批量导入失败
const handleUploadError = () => {
  ElMessage.error('批量导入失败');
};

// 批量导入进度
const handleUploadProgress = (event: ProgressEvent) => {
  uploadProgress.value = Math.round((event.loaded / event.total) * 100);
  uploadStatus.value = 'active';
};

// 编辑项
const editItem = (row: MaintenanceRecord) => {
  dialogTitle.value = '编辑';
  form.value = { ...row };
  dialogVisible.value = true;
};

// 保存项
const saveItem = async () => {
  try {
    if (form.value.ID === 0) {
      await axios.post(`${apiBaseUrl}/api/EquipmentMaintenanceOrder`, form.value);
      ElMessage.success('添加成功');
    } else {
      await axios.put(`${apiBaseUrl}/api/EquipmentMaintenanceOrder/${form.value.ID}`, form.value);
      ElMessage.success('编辑成功');
    }
    dialogVisible.value = false;
    fetchData(searchQuery.value);
  } catch (error) {
    console.error('保存失败', error);
    ElMessage.error('保存失败');
  }
};

// 删除单个项
const deleteItem = async (id: number) => {
  try {
    await axios.delete(`${apiBaseUrl}/api/EquipmentMaintenanceOrder/${id}`);
    ElMessage.success('删除成功');
    fetchData(searchQuery.value);
  } catch (error) {
    console.error('删除失败', error);
    ElMessage.error('删除失败');
  }
};

// 多选删除
const deleteSelectedItems = async () => {
  if (multipleSelection.value.length === 0) {
    ElMessage.warning('请先选择要删除的项');
    return;
  }

  try {
    const ids = multipleSelection.value.map(item => item.ID);
    await axios.post(`${apiBaseUrl}/api/EquipmentMaintenanceOrder/delete-selected`, { ids });
    ElMessage.success('删除成功');
    fetchData(searchQuery.value);
  } catch (error) {
    console.error('删除失败', error);
    ElMessage.error('删除失败');
  }
};

// 批量删除
const deleteAllItems = async () => {
  try {
    await axios.delete(`${apiBaseUrl}/api/EquipmentMaintenanceOrder/delete-all`);
    ElMessage.success('批量删除成功');
    fetchData(searchQuery.value);
  } catch (error) {
    console.error('批量删除失败', error);
    ElMessage.error('批量删除失败');
  }
};


// 导出所有数据
const exportAllData = async () => {
  try {
    const response = await axios.get(`${apiBaseUrl}/api/EquipmentMaintenanceOrder/export`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', '电梯_维保单登记.xlsx');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    ElMessage.success('导出成功');
  } catch (error) {
    console.error('导出失败', error);
    ElMessage.error('导出失败');
  }
};
// 搜索按钮点击事件
const handleSearch = () => {
  currentPage.value = 1; // 重置到第一页
  fetchData(searchQuery.value);
};

// 重置搜索按钮点击事件
const resetSearch = () => {
  searchQuery.value = '';
  fetchData();
};

onMounted(() => {
  fetchData();
});
</script>

<style scoped>
.btn-container {
  margin-bottom: 20px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}
</style>