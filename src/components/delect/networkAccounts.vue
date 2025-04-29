<template>
    <div>
      <el-card>
        <template #header>
          <h1>{{ resourceName }} 管理</h1>
        </template>
        <el-row>
          <el-col :span="12">
            <el-input v-model="searchQuery" placeholder="搜索使用单位" @input="search" clearable />
          </el-col>
          <el-col :span="6">
            <el-button @click="exportData">导出数据</el-button>
          </el-col>
          <el-col :span="6">
            <el-button type="primary" @click="addItem">新增账号</el-button>
          </el-col>
        </el-row>
        <el-table :data="data" stripe>
          <el-table-column v-for="(column, index) in columns" :key="index" :prop="column" :label="column" />
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
          <el-form-item
            v-for="column in columns.filter(col => col !== 'ID' && col !== '创建时间') "
            :key="column"
            :label="column"
          >
            <el-input v-model="formData[column]" />
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
    '使用单位': string;
    '网上注册号码': string;
    '网上注册密码': string;
    '统一社会信用代码': string;
    '缴费账户密码': string;
    '创建时间': string;
    [key: string]: string | undefined; // 添加索引签名
  }
  
  interface ApiResponse {
    data: Resource[];
    totalCount: number;
  }
  
  const apiBaseUrl = 'http://localhost:3000';
  
  const resource = ref('networkAccounts');
  const resourceName = ref('使用单位网络账号管理表');
  const columns = ref<string[]>(['ID', '使用单位', '网上注册号码', '网上注册密码', '统一社会信用代码', '缴费账户密码', '创建时间']);
  const data = ref<Resource[]>([]);
  const searchQuery = ref('');
  const currentPage = ref(1);
  const pageSize = ref(10);
  const totalCount = ref(0);
  const dialogVisible = ref(false);
  const formData = ref<Resource>({
    ID: '',
    '使用单位': '',
    '网上注册号码': '',
    '网上注册密码': '',
    '统一社会信用代码': '',
    '缴费账户密码': '',
    '创建时间': ''
  });
  const dialogTitle = ref('');
  
  const fetchData = async () => {
    try {
      const response = await axios.get<ApiResponse>(`${apiBaseUrl}/api/${resource.value}`, {
        params: {
          page: currentPage.value,
          limit: pageSize.value,
          q: searchQuery.value
        }
      });
      data.value = response.data.data;
      totalCount.value = response.data.totalCount;
      console.log('获取的数据:', data.value); // 调试信息
    } catch (error) {
      console.error('获取数据时出错:', error);
    }
  };
  
  const search = () => {
    currentPage.value = 1;
    fetchData();
    console.log('搜索内容:', searchQuery.value); // 调试信息
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
      '使用单位': '',
      '网上注册号码': '',
      '网上注册密码': '',
      '统一社会信用代码': '',
      '缴费账户密码': '',
      '创建时间': ''
    };
    dialogVisible.value = true;
    dialogTitle.value = `新增 ${resourceName.value}`;
  };
  
  const saveForm = async () => {
    try {
      if (formData.value.ID) {
        const { ID, '创建时间': 创建时间, ...rest } = formData.value;
        await axios.put(`${apiBaseUrl}/api/${resource.value}/${formData.value.ID}`, rest);
      } else {
        const { ID, '创建时间': 创建时间, ...rest } = formData.value;
        await axios.post(`${apiBaseUrl}/api/${resource.value}`, rest);
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
  
  onMounted(() => {
    fetchData();
  });
  </script>
  
  <style scoped>
  /* 可按需添加更多样式 */
  </style>