using ExpensesTracker.api.DTOs.NewFolder;

namespace ExpensesTracker.api.Interfaces

{
    public interface IReportService
    {
        Task<List<MonthlySummaryDto>> GetMonthlySummaryAsync();

        Task<List<MonthlySummaryDto>> GetMonthlySummaryByUserAsync(int userId);
    }

}
