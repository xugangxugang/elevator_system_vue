<template>
  <div>
    <el-card>
      <template #header>
        <h1>{{ resourceName }} 管理</h1>
      </template>
      <el-row>
        <el-col :span="12">
          <el-input v-model="searchQuery" placeholder="搜索纸质文件编号" @input="search" clearable />
        </el-col>
        <el-col :span="6">
          <el-button @click="exportData">导出数据</el-button>
        </el-col>
        <el-col :span="6">
          <el-button type="primary" @click="addItem">新增纸质文件</el-button>
        </el-col>
      </el-row>
      <el-table :data="data" stripe>
        <el-table-column prop="ID" label="ID" />
        <el-table-column prop="档案盒编号" label="档案盒编号" />
        <el-table-column prop="纸质文件编号" label="纸质文件编号" />
        <el-table-column prop="文件类型" label="文件类型" />
        <el-table-column prop="归档日期" label="归档日期" />
        <el-table-column prop="归档人" label="归档人" />
        <el-table-column prop="创建时间" label="创建时间" />
        <el-table-column label="操作">
          <template #default="scope">
            <el-button size="small" @click="editItem(scope.row)">编辑</el-button>
            <el-button size="small" type="danger" @click="deleteItem(scope.row.ID)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :current-page="currentPage"
        :page-sizes="[10, 20, 30]"
        :page-size="pageSize"
        layout="total, sizes, prev, pager, next, jumper"
        :total="totalCount"
      />
    </el-card>
    <el-dialog v-model="dialogVisible" :title="dialogTitle">
      <el-form :model="formData" label-width="120px">
        <el-form-item label="档案盒编号">
          <el-input v-model="formData.档案盒编号" />
        </el-form-item>
        <el-form-item label="纸质文件编号">
          <el-input v-model="formData.纸质文件编号" :disabled="!!formData.ID" />
          <el-button @click="generateFileNumber" style="margin-left: 10px;">自动生成</el-button>
          <div v-if="fileNumberError" style="color: red; font-size: 12px;">
            {{ fileNumberError }}
          </div>
        </el-form-item>
        <el-form-item label="文件类型">
          <el-select v-model="formData.文件类型" placeholder="请选择文件类型" filterable>
            <el-option
              v-for="type in fileTypes"
              :key="type.ID"
              :label="type.文件类型名称"
              :value="type.文件类型名称"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="归档日期">
          <el-date-picker v-model="formData.归档日期" type="date" placeholder="选择日期" />
        </el-form-item>
        <el-form-item label="归档人">
          <el-select v-model="formData.归档人" placeholder="请选择归档人" filterable>
            <el-option
              v-for="employee in employees"
              :key="employee.ID"
              :label="employee.职员名称"
              :value="employee.职员名称"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveForm">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';

// 定义接口
interface Resource {
  ID: string;
  '档案盒编号': string;
  '纸质文件编号': string;
  '文件类型': string;
  '归档日期': string;
  '归档人': string;
  '创建时间': string;
  [key: string]: string | null | undefined;
}

interface Column {
  prop: string;
  label: string;
}

const apiBaseUrl = 'http://localhost:3000';

const resource = ref('paperFiles');
const resourceName = ref('纸质文件表');

const columns = ref<Column[]>([
  { prop: 'ID', label: 'ID' },
  { prop: '档案盒编号', label: '档案盒编号' },
  { prop: '纸质文件编号', label: '纸质文件编号' },
  { prop: '文件类型', label: '文件类型' },
  { prop: '归档日期', label: '归档日期' },
  { prop: '归档人', label: '归档人' },
  { prop: '创建时间', label: '创建时间' }
]);

const data = ref<Resource[]>([]);
const searchQuery = ref('');
const currentPage = ref(1);
const pageSize = ref(10);
const totalCount = ref(0);
const dialogVisible = ref(false);
const formData = ref<Resource>({
  ID: '',
  '档案盒编号': '',
  '纸质文件编号': '',
  '文件类型': '',
  '归档日期': '',
  '归档人': '',
  '创建时间': ''
});
const dialogTitle = ref('');
const fileTypes = ref<Resource[]>([]);
const employees = ref<Resource[]>([]);
const fileNumberError = ref('');

const fetchData = async () => {
  try {
    const response = await axios.get<Record<string, any>>(`${apiBaseUrl}/api/${resource.value}`, {
      params: {
        page: currentPage.value,
        limit: pageSize.value,
        q: searchQuery.value
      }
    });
    data.value = response.data.data as Resource[];
    totalCount.value = response.data.totalCount;
  } catch (error) {
    console.error('获取数据时出错:', error);
  }
};

const fetchFileTypes = async () => {
  try {
    const response = await axios.get(`${apiBaseUrl}/api/fileTypes`);
    fileTypes.value = response.data.data as Resource[];
  } catch (error) {
    console.error('获取文件类型数据时出错:', error);
  }
};

const fetchEmployees = async () => {
  try {
    const response = await axios.get(`${apiBaseUrl}/api/employees/select`);
    employees.value = response.data.data as Resource[];
  } catch (error) {
    console.error('获取职员数据时出错:', error);
  }
};

const search = () => {
  currentPage.value = 1;
  fetchData();
};

const exportData = async () => {
  try {
    const response = await axios.get(`${apiBaseUrl}/api/${resource.value}/export`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${resourceName.value}.xlsx`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('导出数据时出错:', error);
  }
};

const editItem = (item: Resource) => {
  formData.value = { ...item };
  dialogVisible.value = true;
  dialogTitle.value = `编辑 ${resourceName.value}`;
};

const addItem = () => {
  formData.value = {
    ID: '',
    '档案盒编号': '',
    '纸质文件编号': '',
    '文件类型': '',
    '归档日期': '',
    '归档人': '',
    '创建时间': ''
  };
  fileNumberError.value = '';
  dialogVisible.value = true;
  dialogTitle.value = `新增 ${resourceName.value}`;
};

const saveForm = async () => {
  try {
    if (formData.value.ID) {
      await axios.put(`${apiBaseUrl}/api/${resource.value}/${formData.value.ID}`, formData.value);
    } else {
      await axios.post(`${apiBaseUrl}/api/${resource.value}`, formData.value);
    }
    dialogVisible.value = false;
    fetchData();
  } catch (error) {
    console.error('保存数据时出错:', error);
  }
};

const deleteItem = async (id: string) => {
  if (confirm('确定要删除这条记录吗？')) {
    try {
      await axios.delete(`${apiBaseUrl}/api/${resource.value}/${id}`);
      fetchData();
    } catch (error) {
      console.error('删除数据时出错:', error);
    }
  }
};

const handleSizeChange = (newSize: number) => {
  pageSize.value = newSize;
  fetchData();
};

const handleCurrentChange = (newPage: number) => {
  currentPage.value = newPage;
  fetchData();
};

const generateFileNumber = async () => {
  try {
    const response = await axios.get(`${apiBaseUrl}/api/fileNumberRoutes/generate-file-number`);
    formData.value.纸质文件编号 = response.data.fileNumber;
  } catch (error) {
    console.error('生成文件编号时出错:', error);
  }
};

onMounted(() => {
  fetchData();
  fetchFileTypes();
  fetchEmployees();
});
</script>

<style scoped>
/* 可按需添加更多样式 */
</style>