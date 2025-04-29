<template>
    <div>
      <el-card>
        <template #header>
          <h1>{{ resourceName }} 管理</h1>
        </template>
        <el-row>
          <el-col :span="12">
            <el-input v-model="searchQuery" placeholder="搜索档案盒编号或检查人姓名" @input="search" clearable />
          </el-col>
          <el-col :span="6">
            <el-button @click="exportData">导出数据</el-button>
          </el-col>
          <el-col :span="6">
            <el-button type="primary" @click="addItem">新增检查记录</el-button>
          </el-col>
        </el-row>
        <el-table :data="data" stripe>
          <el-table-column v-for="(column, index) in columns" :key="index" :prop="column" :label="column" />
          <el-table-column label="操作">
            <template #default="scope">
              <el-button size="small" @click="editItem(scope.row)">编辑</el-button>
              <el-button size="small" type="danger" @click="deleteItem(scope.row.ID)">删除</el-button>
              <el-button size="small" type="info" @click="viewItem(scope.row)">查看</el-button>
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
  
      <!-- 新增/编辑对话框 -->
      <el-dialog v-model="dialogVisible" :title="dialogTitle" width="60%">
        <el-form 
          :model="formData" 
          label-width="140px"
          ref="formRef"
          :rules="rules"
        >
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="年份" prop="年份">
                <el-input v-model="formData.年份" placeholder="请输入年份" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="档案盒编号" prop="档案盒编号">
                <el-input v-model="formData.档案盒编号" placeholder="请输入档案盒编号" />
              </el-form-item>
            </el-col>
          </el-row>
  
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="检查日期" prop="检查日期">
                <el-date-picker v-model="formData.检查日期" type="date" placeholder="选择日期" style="width: 100%;" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="检查人姓名" prop="检查人姓名">
                <el-input v-model="formData.检查人姓名" placeholder="请输入检查人姓名" />
              </el-form-item>
            </el-col>
          </el-row>
  
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="基本情况表有无" prop="基本情况表有无">
                <el-select v-model="formData.基本情况表有无" placeholder="请选择">
                  <el-option label="有" value="有" />
                  <el-option label="无" value="无" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="维保合同有无" prop="维保合同有无">
                <el-select v-model="formData.维保合同有无" placeholder="请选择">
                  <el-option label="有" value="有" />
                  <el-option label="无" value="无" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
  
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="维保计划表有无" prop="维保计划表有无">
                <el-select v-model="formData.维保计划表有无" placeholder="请选择">
                  <el-option label="有" value="有" />
                  <el-option label="无" value="无" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="自检报告有无" prop="自检报告有无">
                <el-select v-model="formData.自检报告有无" placeholder="请选择">
                  <el-option label="有" value="有" />
                  <el-option label="无" value="无" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
  
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="电梯年检合格证有无" prop="电梯年检合格证有无">
                <el-select v-model="formData.电梯年检合格证有无" placeholder="请选择">
                  <el-option label="有" value="有" />
                  <el-option label="无" value="无" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="备注" prop="备注">
                <el-input v-model="formData.备注" type="textarea" placeholder="请输入备注" />
              </el-form-item>
            </el-col>
          </el-row>
  
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="基本情况表文件编号" prop="基本情况表文件编号">
                <el-input v-model="formData.基本情况表文件编号" placeholder="请输入文件编号" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="维保合同文件编号" prop="维保合同文件编号">
                <el-input v-model="formData.维保合同文件编号" placeholder="请输入文件编号" />
              </el-form-item>
            </el-col>
          </el-row>
  
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="维保计划表文件编号" prop="维保计划表文件编号">
                <el-input v-model="formData.维保计划表文件编号" placeholder="请输入文件编号" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="自检报告文件编号" prop="自检报告文件编号">
                <el-input v-model="formData.自检报告文件编号" placeholder="请输入文件编号" />
              </el-form-item>
            </el-col>
          </el-row>
  
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="合格证文件编号" prop="合格证文件编号">
                <el-input v-model="formData.合格证文件编号" placeholder="请输入文件编号" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="合格报告文件编号" prop="合格报告文件编号">
                <el-input v-model="formData.合格报告文件编号" placeholder="请输入文件编号" />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
        <template #footer>
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveForm">保存</el-button>
        </template>
      </el-dialog>
  
      <!-- 查看详情对话框 -->
      <el-dialog v-model="detailDialogVisible" title="查看详情" width="60%">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="年份">{{ selectedData?.年份 }}</el-descriptions-item>
          <el-descriptions-item label="档案盒编号">{{ selectedData?.档案盒编号 }}</el-descriptions-item>
          <el-descriptions-item label="检查日期">{{ selectedData?.检查日期 }}</el-descriptions-item>
          <el-descriptions-item label="检查人姓名">{{ selectedData?.检查人姓名 }}</el-descriptions-item>
          <el-descriptions-item label="基本情况表有无">{{ selectedData?.基本情况表有无 }}</el-descriptions-item>
          <el-descriptions-item label="维保合同有无">{{ selectedData?.维保合同有无 }}</el-descriptions-item>
          <el-descriptions-item label="维保计划表有无">{{ selectedData?.维保计划表有无 }}</el-descriptions-item>
          <el-descriptions-item label="自检报告有无">{{ selectedData?.自检报告有无 }}</el-descriptions-item>
          <el-descriptions-item label="电梯年检合格证有无">{{ selectedData?.电梯年检合格证有无 }}</el-descriptions-item>
          <el-descriptions-item label="备注">{{ selectedData?.备注 }}</el-descriptions-item>
          <el-descriptions-item label="基本情况表文件编号">{{ selectedData?.基本情况表文件编号 }}</el-descriptions-item>
          <el-descriptions-item label="维保合同文件编号">{{ selectedData?.维保合同文件编号 }}</el-descriptions-item>
          <el-descriptions-item label="维保计划表文件编号">{{ selectedData?.维保计划表文件编号 }}</el-descriptions-item>
          <el-descriptions-item label="自检报告文件编号">{{ selectedData?.自检报告文件编号 }}</el-descriptions-item>
          <el-descriptions-item label="合格证文件编号">{{ selectedData?.合格证文件编号 }}</el-descriptions-item>
          <el-descriptions-item label="合格报告文件编号">{{ selectedData?.合格报告文件编号 }}</el-descriptions-item>
        </el-descriptions>
      </el-dialog>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted } from 'vue';
  import axios from 'axios';
  import { ElForm } from 'element-plus';
  
  // 定义接口
  interface CheckRecord {
    ID: string;
    年份: string;
    档案盒编号: string;
    检查日期: string;
    检查人姓名: string;
    基本情况表有无: string;
    维保合同有无: string;
    维保计划表有无: string;
    自检报告有无: string;
    电梯年检合格证有无: string;
    备注: string;
    基本情况表文件编号: string;
    维保合同文件编号: string;
    维保计划表文件编号: string;
    自检报告文件编号: string;
    合格证文件编号: string;
    合格报告文件编号: string;
  }
  
  const apiBaseUrl = 'http://localhost:3000';
  
  const resource = ref('checkRecords');
  const resourceName = ref('档案盒检查记录');
  const columns = ref([
    'ID',
    '年份',
    '档案盒编号',
    '检查日期',
    '检查人姓名',
    '基本情况表有无',
    '维保合同有无',
    '维保计划表有无',
    '自检报告有无',
    '电梯年检合格证有无',
    '备注'
  ]);
  const data = ref<CheckRecord[]>([]);
  const searchQuery = ref('');
  const currentPage = ref(1);
  const pageSize = ref(10);
  const totalCount = ref(0);
  const dialogVisible = ref(false);
  const detailDialogVisible = ref(false);
  const selectedData = ref<CheckRecord | null>(null);
  const formData = ref<CheckRecord>({
    ID: '',
    年份: '',
    档案盒编号: '',
    检查日期: '',
    检查人姓名: '',
    基本情况表有无: '',
    维保合同有无: '',
    维保计划表有无: '',
    自检报告有无: '',
    电梯年检合格证有无: '',
    备注: '',
    基本情况表文件编号: '',
    维保合同文件编号: '',
    维保计划表文件编号: '',
    自检报告文件编号: '',
    合格证文件编号: '',
    合格报告文件编号: ''
  });
  const dialogTitle = ref('');
  const formRef = ref<InstanceType<typeof ElForm>>();
  
  const rules = {
    '档案盒编号': [{ required: true, message: '档案盒编号不能为空', trigger: 'blur' }],
    '检查日期': [{ required: true, message: '检查日期不能为空', trigger: 'blur' }],
    '检查人姓名': [{ required: true, message: '检查人姓名不能为空', trigger: 'blur' }]
  };
  
  const fetchData = async () => {
    try {
      const response = await axios.get(`${apiBaseUrl}/api/${resource.value}`, {
        params: {
          page: currentPage.value,
          limit: pageSize.value,
          q: searchQuery.value
        }
      });
  
      data.value = response.data.data;
      totalCount.value = response.data.totalCount;
    } catch (error) {
      console.error('获取数据时出错:', error);
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
  
  const editItem = (item: CheckRecord) => {
    formData.value = { ...item };
    dialogVisible.value = true;
    dialogTitle.value = `编辑 ${resourceName.value}`;
  };
  
  const addItem = () => {
    formData.value = {
      ID: '',
      年份: '',
      档案盒编号: '',
      检查日期: '',
      检查人姓名: '',
      基本情况表有无: '',
      维保合同有无: '',
      维保计划表有无: '',
      自检报告有无: '',
      电梯年检合格证有无: '',
      备注: '',
      基本情况表文件编号: '',
      维保合同文件编号: '',
      维保计划表文件编号: '',
      自检报告文件编号: '',
      合格证文件编号: '',
      合格报告文件编号: ''
    };
    dialogVisible.value = true;
    dialogTitle.value = `新增 ${resourceName.value}`;
  };
  
  const viewItem = (item: CheckRecord) => {
    selectedData.value = { ...item };
    detailDialogVisible.value = true;
  };
  
  const saveForm = async () => {
    try {
      const isValid = await formRef.value?.validate();
  
      if (!isValid) return;
  
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
  
  onMounted(() => {
    fetchData();
  });
  </script>
  
  <style scoped>
  /* 可按需添加更多样式 */
  </style>