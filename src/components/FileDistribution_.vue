<template>
    <div>
      <el-card>
        <template #header>
          <h1>{{ resourceName }} 管理</h1>
        </template>
        <el-row>
          <el-col :span="12">
            <el-input v-model="searchQuery" placeholder="搜索文件名称" @input="search" clearable />
          </el-col>
          <el-col :span="6">
            <el-button @click="exportData">导出数据</el-button>
          </el-col>
          <el-col :span="6">
            <el-button type="primary" @click="addItem">新增文件</el-button>
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
        <el-form :model="formData" label-width="120px" :rules="rules" ref="formRef">
          <el-form-item
            v-for="column in columns.filter(col => col.prop !== 'ID' && col.prop !== '创建时间'&& col.prop !== 'NO') "
            :key="column.prop"
            :label="column.label"
            :prop="column.prop"
            :error="errors[column.prop]"
          >
            <el-input
              v-model="formData[column.prop as keyof FileDistribution]"
              :disabled="dialogTitle.includes('编辑') && column.prop === '文件编号'"
            >
              <template #append v-if="column.prop === '文件编号' && dialogTitle.includes('新增')">
                <el-button type="success" @click="generateFileNumber">获取</el-button>
              </template>
            </el-input>
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
  import { ElForm, ElMessage, ElMessageBox } from 'element-plus';
  
  interface FileDistribution {
    ID: string;
    文件编号: string;
    文件名称: string;
    版本年号: string;
    总份数: number;
    法定代表人份数: number;
    质保工程师份数: number;
    工程部份数: number;
    技术质量部份数: number;
    办公室份数: number;
    归档份数: number;
    结余: number;
    备注: string;
    编制人: string;
    编制日期: string;
    审批人: string;
    审批日期: string;

    创建时间?: string;
  }
  
  interface ApiResponse {
    data: FileDistribution[];
    totalCount: number;
    totalPages: number;
  }
  
  const apiBaseUrl = 'http://localhost:3000/api';
  const resource = ref('file-distributions');
  const resourceName = ref('公司_文件发放控制清单');
  
  const columns = ref([
    { prop: 'ID', label: 'ID' },
    { prop: '文件编号', label: '文件编号' },
    { prop: '文件名称', label: '文件名称' },
    { prop: '版本年号', label: '版本年号' },
    { prop: '总份数', label: '总份数' },
    { prop: '法定代表人份数', label: '法定代表人份数' },
    { prop: '质保工程师份数', label: '质保工程师份数' },
    { prop: '工程部份数', label: '工程部份数' },
    { prop: '技术质量部份数', label: '技术质量部份数' },
    { prop: '办公室份数', label: '办公室份数' },
    { prop: '归档份数', label: '归档份数' },
    { prop: '结余', label: '结余' },
    { prop: '备注', label: '备注' },
    { prop: '编制人', label: '编制人' },
    { prop: '编制日期', label: '编制日期' },
    { prop: '审批人', label: '审批人' },
    { prop: '审批日期', label: '审批日期' },
    { prop: 'NO', label: 'NO' }
  ]);
  
  const data = ref<FileDistribution[]>([]);
  const searchQuery = ref('');
  const currentPage = ref(1);
  const pageSize = ref(10);
  const totalCount = ref(0);
  const dialogVisible = ref(false);
  const formData = ref<FileDistribution>({
    ID: '',
    文件编号: '',
    文件名称: '',
    版本年号: '',
    总份数: 0,
    法定代表人份数: 0,
    质保工程师份数: 0,
    工程部份数: 0,
    技术质量部份数: 0,
    办公室份数: 0,
    归档份数: 0,
    结余: 0,
    备注: '',
    编制人: '',
    编制日期: '',
    审批人: '',
    审批日期: '',
    创建时间: new Date().toISOString()
  });
  const dialogTitle = ref('');
  const formRef = ref<InstanceType<typeof ElForm> | null>(null);
  const errors = ref<Record<string, string>>({});
  
  const rules = {
    '文件编号': [{ required: true, message: '文件编号不能为空', trigger: 'blur' }],
    '文件名称': [{ required: true, message: '文件名称不能为空', trigger: 'blur' }],
    '版本年号': [{ required: true, message: '版本年号不能为空', trigger: 'blur' }],
    '总份数': [{ required: true, message: '总份数不能为空', trigger: 'blur' }],
    '法定代表人份数': [{ required: true, message: '法定代表人份数不能为空', trigger: 'blur' }],
    '质保工程师份数': [{ required: true, message: '质保工程师份数不能为空', trigger: 'blur' }],
    '工程部份数': [{ required: true, message: '工程部份数不能为空', trigger: 'blur' }],
    '技术质量部份数': [{ required: true, message: '技术质量部份数不能为空', trigger: 'blur' }],
    '办公室份数': [{ required: true, message: '办公室份数不能为空', trigger: 'blur' }],
    '归档份数': [{ required: true, message: '归档份数不能为空', trigger: 'blur' }],
    '结余': [{ required: true, message: '结余不能为空', trigger: 'blur' }]
    
  };
  
  const fetchData = async () => {
    try {
      const response = await axios.get<ApiResponse>(`${apiBaseUrl}/${resource.value}`, {
        params: {
          page: currentPage.value,
          limit: pageSize.value,
          q: searchQuery.value
        }
      });
  
      data.value = response.data.data;
      totalCount.value = response.data.totalCount;
    } catch (error) {
      handleAxiosError(error);
    }
  };
  
  const search = () => {
    currentPage.value = 1;
    fetchData();
  };
  
  const exportData = async () => {
    try {
      const response = await axios.get(`${apiBaseUrl}/${resource.value}/export`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${resourceName.value}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      handleAxiosError(error);
    }
  };
  
  const editItem = (item: FileDistribution) => {
    formData.value = { ...item };
    dialogVisible.value = true;
    dialogTitle.value = `编辑 ${resourceName.value}`;
    errors.value = {};
  };
  
  const addItem = () => {
    formData.value = {
      ID: '',
      文件编号: '',
      文件名称: '',
      版本年号: '',
      总份数: 0,
      法定代表人份数: 0,
      质保工程师份数: 0,
      工程部份数: 0,
      技术质量部份数: 0,
      办公室份数: 0,
      归档份数: 0,
      结余: 0,
      备注: '',
      编制人: '',
      编制日期: '',
      审批人: '',
      审批日期: '',
      
      创建时间: new Date().toISOString()
    };
    dialogVisible.value = true;
    dialogTitle.value = `新增 ${resourceName.value}`;
    errors.value = {};
  };
  
  const saveForm = async () => {
    const form = formRef.value;
    if (!form) return;
  
    try {
      const isValid = await form.validate();
      if (!isValid) return;
  
      if (formData.value.ID) {
        await axios.put(`${apiBaseUrl}/${resource.value}/${formData.value.ID}`, {
          ...formData.value,
          创建时间: undefined
        });
      } else {
        await axios.post(`${apiBaseUrl}/${resource.value}/`, {
          ...formData.value,
          创建时间: undefined
        });
      }
      dialogVisible.value = false;
      fetchData();
      ElMessage.success('保存成功');
      errors.value = {};
    } catch (error) {
      handleAxiosError(error);
    }
  };
  
  const deleteItem = async (id: string) => {
    if (confirm('确定要删除这条记录吗？')) {
      try {
        await axios.delete(`${apiBaseUrl}/${resource.value}/${id}`);
        fetchData();
        ElMessage.success('删除成功');
      } catch (error) {
        handleAxiosError(error);
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
  
  const handleAxiosError = (error: any) => {
    if (error.response) {
      if (error.response.status === 400 && error.response.data.errors) {
        const errorMessages = error.response.data.errors.reduce((acc: Record<string, string>, errorItem: any) => {
          acc[errorItem.param] = errorItem.msg;
          return acc;
        }, {});
        errors.value = errorMessages;
        ElMessageBox.alert(
          Object.values(errorMessages).join('<br>'),
          '表单验证失败',
          {
            confirmButtonText: '确定',
            type: 'error',
            dangerouslyUseHTMLString: true
          }
        );
      } else {
        ElMessageBox.alert(
          error.response.data.message || '请求失败，请稍后再试',
          '错误',
          {
            confirmButtonText: '确定',
            type: 'error'
          }
        );
      }
    } else if (error.request) {
      ElMessageBox.alert(
        '无法连接到服务器，请检查网络',
        '错误',
        {
          confirmButtonText: '确定',
          type: 'error'
        }
      );
    } else {
      ElMessageBox.alert(
        error.message,
        '错误',
        {
          confirmButtonText: '确定',
          type: 'error'
        }
      );
    }
    console.error('请求出错:', error);
  };
  
  const generateFileNumber = async () => {
    try {
      const response = await axios.get(`${apiBaseUrl}/${resource.value}/generate-file-number`);
      formData.value.文件编号 = response.data;
      ElMessage.success('获取文件编号成功');
    } catch (error) {
      handleAxiosError(error);
    }
  };
  
  onMounted(() => {
    fetchData();
  });
  </script>
  
  <style scoped>
  .error-message {
    margin-top: 20px;
  }
  </style>