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
          <el-table-column v-for="(column, index) in columns" :key="index" :prop="column.prop" :label="column.label" />
          <el-table-column label="操作">
            <template #default="scope">
              <el-button size="small" @click="editItem(scope.row)">编辑</el-button>
              <el-button size="small" type="danger" @click="deleteItem(scope.row.ID)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 30]"
          :total="totalCount"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </el-card>
      <el-dialog v-model="dialogVisible" :title="dialogTitle">
        <el-form :model="formData" label-width="120px">
          <el-form-item
            v-for="column in columns.filter(col => col.prop !== 'ID')"
            :key="column.prop"
            :label="column.label"
          >
            <el-input v-model="formData[column.prop]" />
            <div v-for="(errorItem, errorIndex) in formErrors" :key="errorIndex">
              <div v-if="errorItem.param === column.prop" style="color: red; font-size: 12px;">
                {{ errorItem.msg }}
              </div>
            </div>
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
    '法人': string;
    [key: string]: string | undefined;
  }
  
  interface Column {
    prop: string;
    label: string;
  }
  
  interface ErrorItem {
    param: string;
    msg: string;
  }
  
  // 后端返回的错误响应接口
  interface ErrorResponse {
    errors: ErrorItem[];
  }
  
  const apiBaseUrl = 'http://localhost:3000';
  
  const resource = ref('network-accounts');
  const resourceName = ref('使用单位网络账号');
  const columns = ref<Column[]>([
    { prop: 'ID', label: 'ID' },
    { prop: '使用单位', label: '使用单位' },
    { prop: '网上注册号码', label: '网上注册号码' },
    { prop: '网上注册密码', label: '网上注册密码' },
    { prop: '统一社会信用代码', label: '统一社会信用代码' },
    { prop: '缴费账户密码', label: '缴费账户密码' },
    { prop: '法人', label: '法人' }
  ]);
  const data = ref<Resource[]>([]);
  const searchQuery = ref('');
  const currentPage = ref(1);
  const pageSize = ref(10);
  const totalCount = ref(0);
  const dialogVisible = ref(false);
  const formErrors = ref<ErrorResponse['errors'] | null>(null);
  const formData = ref<Resource>({
    ID: '',
    '使用单位': '',
    '网上注册号码': '',
    '网上注册密码': '',
    '统一社会信用代码': '',
    '缴费账户密码': '',
    '法人': ''
  });
  const dialogTitle = ref('');
  
  // 获取数据
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
  
  // 搜索结果
  const search = () => {
    currentPage.value = 1;
    fetchData();
  };
  
  // 导出数据
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
  
  // 编辑项目
  const editItem = (item: Resource) => {
    formData.value = { ...item };
    dialogVisible.value = true;
    dialogTitle.value = `编辑 ${resourceName.value}`;
  };
  
  // 添加新项目
  const addItem = () => {
    formData.value = {
      ID: '',
      '使用单位': '',
      '网上注册号码': '',
      '网上注册密码': '',
      '统一社会信用代码': '',
      '缴费账户密码': '',
      '法人': ''
    };
    dialogVisible.value = true;
    dialogTitle.value = `新增 ${resourceName.value}`;
  };
  
  // 保存表单
  const saveForm = async () => {
    try {
      if (formData.value.ID) {
        const { ID, ...rest } = formData.value;
        await axios.put(`${apiBaseUrl}/api/${resource.value}/${formData.value.ID}`, rest);
      } else {
        await axios.post(`${apiBaseUrl}/api/${resource.value}`, formData.value);
      }
      dialogVisible.value = false;
      formData.value = { ...formData.value };
      formErrors.value = null;
      fetchData();
    } catch (error) {
      // 使用类型断言处理 error 类型
      if (axios.isAxiosError(error)) {
        if (error.response && error.response.status === 400) {
          formErrors.value = error.response.data.errors as ErrorResponse['errors'];
        } else {
          console.error('保存数据时出错:', error);
        }
      } else {
        console.error('保存数据时出错:', error);
      }
    }
  };
  
  // 删除项目
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
  
  // 分页处理
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