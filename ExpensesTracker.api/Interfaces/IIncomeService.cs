using ExpensesTracker.api.Models;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

public interface IIncomeService
{
    Task<List<Income>> GetAllAsync();
    Task<Income?> GetById(int id);
    Task<List<Income>> GetByUserId(int userId);
    Task<Income> Create(Income income);
    Task<bool> Update(Income income);
    Task Delete(int id);

    Task<object> GetSummaryByUser(int userId);
    Task<List<Income>> Filter(int? userId, int? categoryId, DateTime? from, DateTime? to);
}
