from django.core.paginator import Paginator

class CustomPaginator(Paginator):
    def __init__(self, *args, **kwargs):
        self.page_window = kwargs.pop('page_window', 5)
        super().__init__(*args, **kwargs)

    def get_page_range(self, current_page):
        min_page = max(current_page - self.page_window, 1)
        max_page = min(current_page + self.page_window, self.num_pages)
        return range(min_page, max_page + 1)