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
          <el-form-item label="文件编号" prop="文件编号">
            <el-select v-model="formData.文件编号" placeholder="选择文件编号" @change="fetchFileDetails">
              <el-option
                v-for="file in fileOptions"
                :key="file.ID"
                :label="file.文件编号"
                :value="file.文件编号"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="文件名称" prop="文件名称">
            <el-input v-model="formData.文件名称" :readonly="true" />
          </el-form-item>
          <el-form-item label="版本年号" prop="版本年号">
            <el-input v-model="formData.版本年号" :readonly="true" />
          </el-form-item>
          <el-form-item
            v-for="column in columns.filter(col => col.prop !== 'ID' && col.prop !== 'NO' && col.prop !== '文件编号' && col.prop !== '文件名称' && col.prop !== '版本年号') "
            :key="column.prop"
            :label="column.label"
            :prop="column.prop"
            :error="errors[column.prop]"
          >
            <template v-if="column.prop === '归档日期' || column.prop === '编制日期'">
              <el-date-picker
                v-model="formData[column.prop as keyof FileArchiving]"
                type="date"
                placeholder="选择日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </template>
            <template v-else>
              <el-input
                v-model="formData[column.prop as keyof FileArchiving]"
                :disabled="dialogTitle.includes('编辑') && column.prop === '文件编号'"
              >
                <template #append v-if="column.prop === '文件编号' && dialogTitle.includes('新增')">
                  <el-button type="success" @click="generateFileNumber">获取</el-button>
                </template>
              </el-input>
            </template>
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
  
  interface FileArchiving {
    ID: string;
    文件编号: string;
    文件名称: string;
    版本年号: string;
    文件来源: string;
    归档份数: number;
    归档人: string;
    归档日期: string;
    受控状态: string;
    编制人: string;
    编制日期: string;
    备注: string;
    NO: string;
  }
  
  interface ApiResponse {
    data: FileArchiving[];
    totalCount: number;
    totalPages: number;
  }
  
  const apiBaseUrl = 'http://localhost:3000/api';
  const resource = ref('file-archiving');
  const resourceName = ref('公司_文件归档登记表');
  
  const columns = ref([
    { prop: 'ID', label: 'ID' },
    { prop: '文件编号', label: '文件编号' },
    { prop: '文件名称', label: '文件名称' },
    { prop: '版本年号', label: '版本年号' },
    { prop: '文件来源', label: '文件来源' },
    { prop: '归档份数', label: '归档份数' },
    { prop: '归档人', label: '归档人' },
    { prop: '归档日期', label: '归档日期' },
    { prop: '受控状态', label: '受控状态' },
    { prop: '编制人', label: '编制人' },
    { prop: '编制日期', label: '编制日期' },
    { prop: '备注', label: '备注' },
    { prop: 'NO', label: 'NO' }
  ]);
  
  const data = ref<FileArchiving[]>([]);
  const searchQuery = ref('');
  const currentPage = ref(1);
  const pageSize = ref(10);
  const totalCount = ref(0);
  const dialogVisible = ref(false);
  const formData = ref<FileArchiving>({
    ID: '',
    文件编号: '',
    文件名称: '',
    版本年号: '',
    文件来源: '',
    归档份数: 0,
    归档人: '',
    归档日期: '',
    受控状态: '',
    编制人: '',
    编制日期: '',
    备注: '',
    NO: ''
  });
  const dialogTitle = ref('');
  const formRef = ref<InstanceType<typeof ElForm> | null>(null);
  const errors = ref<Record<string, string>>({});
  const fileOptions = ref<FileArchiving[]>([]);
  
  const rules = {
    '文件编号': [{ required: true, message: '文件编号不能为空', trigger: 'blur' }],
    '文件名称': [{ required: true, message: '文件名称不能为空', trigger: 'blur' }],
    '版本年号': [{ required: true, message: '版本年号不能为空', trigger: 'blur' }],
    '文件来源': [{ required: true, message: '文件来源不能为空', trigger: 'blur' }],
    '归档份数': [{ required: true, message: '归档份数不能为空', trigger: 'blur' }],
    '归档人': [{ required: true, message: '归档人不能为空', trigger: 'blur' }],
    '归档日期': [{ required: true, message: '归档日期不能为空', trigger: 'blur' }],
    '受控状态': [{ required: true, message: '受控状态不能为空', trigger: 'blur' }]
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
  
  const fetchFileOptions = async () => {
    try {
      const response = await axios.get('/api/file-distributions', {
        params: {
          page: 1,
          limit: 1000,
          q: ''
        }
      });
      fileOptions.value = response.data.data;
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
  
  const editItem = (item: FileArchiving) => {
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
      文件来源: '',
      归档份数: 0,
      归档人: '',
      归档日期: '',
      受控状态: '',
      编制人: '',
      编制日期: '',
      备注: '',
      NO: ''
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
        await axios.put(`${apiBaseUrl}/${resource.value}/${formData.value.ID}`, formData.value);
      } else {
        await axios.post(`${apiBaseUrl}/${resource.value}/`, formData.value);
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
        }, {} as Record<string, string>);
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
  
  const fetchFileDetails = async (fileNumber: string) => {
    try {
      const response = await axios.get('/api/file-distributions', {
        params: {
          q: fileNumber
        }
      });
      const file = response.data.data.find((item: FileArchiving) => item.文件编号 === fileNumber);
      if (file) {
        formData.value.文件名称 = file.文件名称;
        formData.value.版本年号 = file.版本年号;
      }
    } catch (error) {
      handleAxiosError(error);
    }
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
    fetchFileOptions();
  });
  </script>
  
  <style scoped>
  .error-message {
    margin-top: 20px;
  }
  </style>