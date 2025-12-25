"""Crawler service for scraping scam data from multiple sources"""
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from bs4 import BeautifulSoup
import time
import os
import re
import requests
import asyncio
from typing import Dict, Any, List
from concurrent.futures import ThreadPoolExecutor
import httpx
from ..config import settings


class CrawlerService:
    """Service for crawling scam data from various sources"""
    
    def __init__(self):
        self.executor = ThreadPoolExecutor(max_workers=3)
    
    def init_driver(self) -> webdriver.Chrome:
        """Initialize Chrome driver"""
        chrome_options = Options()
        
        if settings.SELENIUM_HEADLESS:
            chrome_options.add_argument('--headless')
        
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--disable-gpu')
        chrome_options.add_argument('--window-size=1920,1080')
        chrome_options.add_argument('--disable-blink-features=AutomationControlled')
        chrome_options.add_argument(
            '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
            '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        )
        chrome_options.add_experimental_option('excludeSwitches', ['enable-logging'])
        chrome_options.add_experimental_option('useAutomationExtension', False)
        
        chromedriver_path = os.path.join(os.getcwd(), 'chromedriver')
        
        if os.path.exists(chromedriver_path):
            service = Service(chromedriver_path)
            return webdriver.Chrome(service=service, options=chrome_options)
        else:
            try:
                from webdriver_manager.chrome import ChromeDriverManager
                service = Service(ChromeDriverManager().install())
                return webdriver.Chrome(service=service, options=chrome_options)
            except:
                return webdriver.Chrome(options=chrome_options)
    
    def scrape_admin_vn(self, keyword: str, driver: webdriver.Chrome) -> Dict[str, Any]:
        """Scrape data from admin.vn"""
        try:
            url = f"https://admin.vn/scams?keyword={keyword}"
            driver.get(url)
            
            wait = WebDriverWait(driver, settings.SELENIUM_TIMEOUT)
            wait.until(EC.presence_of_element_located((By.CLASS_NAME, "container")))
            time.sleep(2)
            
            soup = BeautifulSoup(driver.page_source, 'html.parser')
            
            # Get total scams count
            alert_div = soup.find('div', class_='alert alert-danger text-center')
            total_scams = "0"
            search_keyword = keyword
            
            if alert_div:
                strong_tags = alert_div.find_all('strong')
                if len(strong_tags) >= 2:
                    total_scams = strong_tags[0].text.strip()
                    search_keyword = strong_tags[1].text.strip()
            
            # Get scam cards
            scam_cards = soup.find_all('div', class_='scam-card')
            scam_list = []
            
            for card in scam_cards:
                if 'scam-header' in card.get('class', []):
                    continue
                
                columns = card.find_all('div', class_='scam-column')
                
                if len(columns) >= 7:
                    name_div = columns[0].find('div', class_='limit')
                    name = name_div.text.strip() if name_div else ''
                    
                    amount = columns[1].text.strip()
                    
                    phone = columns[2].text.strip().replace('\n', '').replace(' ', '')
                    phone_parts = phone.split()
                    phone = phone_parts[-1] if phone_parts else phone
                    
                    account_number = columns[3].text.strip()
                    bank = columns[4].text.strip()
                    views = columns[5].text.strip().replace('lượt xem', '').strip()
                    date = columns[6].text.strip()
                    
                    link_tag = card.find('a', class_='stretched-link')
                    detail_link = link_tag['href'] if link_tag else ''
                    
                    scam_list.append({
                        'name': name,
                        'amount': amount,
                        'phone': phone,
                        'account_number': account_number,
                        'bank': bank,
                        'views': views,
                        'date': date,
                        'detail_link': detail_link
                    })
            
            return {
                'success': True,
                'source': 'admin.vn',
                'keyword': search_keyword,
                'total_scams': total_scams,
                'data': scam_list
            }
            
        except Exception as e:
            return {
                'success': False,
                'source': 'admin.vn',
                'error': str(e)
            }
        finally:
            if driver:
                driver.quit()
    
    def scrape_checkscam_vn(self, keyword: str, driver=None) -> Dict[str, Any]:
        """Scrape data from checkscam.vn using Selenium (required for JS rendering)"""
        should_quit = False
        if driver is None:
            driver = self.init_driver()
            should_quit = True
        
        try:
            url = f"https://checkscam.vn/?qh_ss={keyword}"
            driver.get(url)
            
            # Wait for results to load
            from selenium.webdriver.support.ui import WebDriverWait
            from selenium.webdriver.support import expected_conditions as EC
            from selenium.webdriver.common.by import By
            
            wait = WebDriverWait(driver, 10)
            wait.until(EC.presence_of_element_located((By.CLASS_NAME, "pst")))
            time.sleep(2)
            
            soup = BeautifulSoup(driver.page_source, 'html.parser')
            
            # Get total warnings count
            h2_tag = soup.find('h2', class_='h1')
            total_scams = "0"
            search_keyword = keyword
            
            if h2_tag:
                text = h2_tag.get_text()
                match = re.search(r'Có (\d+) cảnh báo', text)
                if match:
                    total_scams = match.group(1)
                match_keyword = re.search(r'"([^"]+)"', text)
                if match_keyword:
                    search_keyword = match_keyword.group(1)
            
            # Get warning list
            scam_list = []
            ct_divs = soup.find_all('div', class_='ct')
            
            # Limit items by total_scams
            max_items = int(total_scams) if total_scams.isdigit() else len(ct_divs)
            
            for i, ct in enumerate(ct_divs):
                if i >= max_items:
                    break
                    
                ct1 = ct.find('div', class_='ct1')
                ct2 = ct.find('div', class_='ct2')
                
                if ct1 and ct2:
                    link_tag = ct1.find('a')
                    if link_tag:
                        name = link_tag.text.strip()
                        detail_link = link_tag['href'] if 'href' in link_tag.attrs else ''
                        
                        spans = ct2.find_all('span')
                        date = ''
                        views = ''
                        
                        for span in spans:
                            text = span.text.strip()
                            if 'Lượt xem' in text:
                                views = text.replace('Lượt xem', '').strip()
                            elif 'tháng' in text or '...' in text:
                                date = text.replace('...', '').strip()
                        
                        scam_list.append({
                            'name': name,
                            'date': date,
                            'views': views,
                            'detail_link': detail_link
                        })
            
            return {
                'success': True,
                'source': 'checkscam.vn',
                'keyword': search_keyword,
                'total_scams': total_scams,
                'data': scam_list
            }
            
        except Exception as e:
            return {
                'success': False,
                'source': 'checkscam.vn',
                'error': str(e)
            }
        finally:
            if should_quit and driver:
                driver.quit()
    
    def scrape_scam_vn(self, keyword: str, driver=None) -> Dict[str, Any]:
        """Search scam.vn using their internal search page (requires Selenium for JS rendering)"""
        should_quit = False
        if driver is None:
            driver = self.init_driver()
            should_quit = True
        
        try:
            # Use scam.vn internal search
            url = f"https://scam.vn/tim-kiem?tu-khoa={keyword}"
            driver.get(url)
            
            # Wait longer for AJAX results to load
            time.sleep(6)
            
            # Get page source after JS execution
            soup = BeautifulSoup(driver.page_source, 'html.parser')
            
            scam_list = []
            
            # Find result table (try multiple selectors)
            table = soup.find('table', class_='table')
            if not table:
                # Try finding by other attributes
                table = soup.find('table')
            
            if table:
                # Find rows - try both class='rs' and all tr tags
                result_rows = table.find_all('tr', class_='rs')
                if not result_rows:
                    # Get all rows except header
                    all_rows = table.find_all('tr')
                    result_rows = [r for r in all_rows if len(r.find_all('td')) >= 3]
                
                for row in result_rows:
                    tds = row.find_all('td')
                    if len(tds) >= 3:
                        # Column 1: STT (skip)
                        # Column 2: Name with link
                        name_cell = tds[1]
                        link_tag = name_cell.find('a')
                        
                        # Column 3: Account info
                        account_cell = tds[2]
                        
                        if link_tag:
                            name = link_tag.get_text().strip()
                            detail_link = link_tag.get('href', '')
                            if detail_link.startswith('/'):
                                detail_link = f"https://scam.vn{detail_link}"
                            
                            # Extract account number
                            account_div = account_cell.find('div', class_='sotaikhoan')
                            account_number = ''
                            account_name = ''
                            if account_div:
                                account_spans = account_div.find_all('span', class_='hidden-info')
                                for span in account_spans:
                                    if span.get('data-type') == 'tknganhang':
                                        account_number = span.get('data-value', '')
                                    elif span.get('data-type') == 'tenkhac':
                                        account_name = span.get('data-value', '')
                            
                            # Extract bank name
                            bank = ''
                            bank_div = account_cell.find('div', class_='tennganhang')
                            if bank_div:
                                bank_badge = bank_div.find('span', class_='badge')
                                if bank_badge:
                                    bank = bank_badge.get_text().strip()
                            
                            scam_list.append({
                                'name': name,
                                'account_number': account_number,
                                'account_name': account_name,
                                'bank': bank,
                                'detail_link': detail_link,
                                'keyword_found': keyword
                            })
            
            return {
                'success': True,
                'source': 'scam.vn',
                'keyword': keyword,
                'total_scams': str(len(scam_list)),
                'data': scam_list
            }
            
        except Exception as e:
            return {
                'success': False,
                'source': 'scam.vn',
                'error': str(e)
            }
        finally:
            if should_quit and driver:
                driver.quit()
    
    async def scrape_chongluadao_vn(self, keyword: str) -> Dict[str, Any]:
        """Scrape data from chongluadao.vn (API-based, no Selenium needed)"""
        try:
            url = f"https://feeds.chongluadao.vn/checkmisc?q={keyword}"
            
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(url)
                response.raise_for_status()
                data = response.json()
            
            scam_list = []
            total_scams = 0
            
            if isinstance(data, list):
                for item in data:
                    source = item.get('source', '')
                    item_data = item.get('data')
                    
                    if item_data:
                        total_scams += 1
                        if source == 'scamvn' and isinstance(item_data, dict):
                            scam_list.append({
                                'name': item_data.get('name', ''),
                                'phone': item_data.get('phone', ''),
                                'account': item_data.get('account', ''),
                                'bank': item_data.get('bank', ''),
                                'amount': item_data.get('amount', ''),
                                'date': item_data.get('date', ''),
                                'source': source,
                                'detail_link': item_data.get('link', '')
                            })
                        elif source == 'icallme' and isinstance(item_data, dict):
                            scam_list.append({
                                'name': item_data.get('name', ''),
                                'phone': item_data.get('phone', ''),
                                'report_time': item_data.get('report_time', ''),
                                'source': source,
                                'detail_link': item_data.get('link', '')
                            })
            
            return {
                'success': True,
                'source': 'chongluadao.vn',
                'keyword': keyword,
                'total_scams': total_scams,
                'data': scam_list
            }
            
        except httpx.TimeoutException:
            return {
                'success': False,
                'source': 'chongluadao.vn',
                'error': 'Request timeout'
            }
        except Exception as e:
            return {
                'success': False,
                'source': 'chongluadao.vn',
                'error': str(e)
            }
    
    async def search_all_sources(self, keyword: str) -> Dict[str, Any]:
        """Search across all sources in parallel"""
        loop = asyncio.get_event_loop()
        
        # Run admin.vn with Selenium in thread pool (needs JS rendering)
        future_admin = loop.run_in_executor(
            self.executor, 
            self.scrape_admin_vn, 
            keyword, 
            self.init_driver()
        )
        
        # Run checkscam.vn with Selenium in thread pool (needs JS rendering)
        future_checkscam = loop.run_in_executor(
            self.executor,
            self.scrape_checkscam_vn,
            keyword,
            self.init_driver()
        )
        
        # Run scam.vn with Selenium in thread pool (also needs JS rendering)
        future_scam = loop.run_in_executor(
            self.executor,
            self.scrape_scam_vn,
            keyword,
            self.init_driver()
        )
        
        # Run async scraper for chongluadao (API-based, fast)
        future_chongluadao = self.scrape_chongluadao_vn(keyword)
        
        # Wait for all to complete
        results = await asyncio.gather(
            future_admin,
            future_checkscam,
            future_scam,
            future_chongluadao,
            return_exceptions=True
        )
        
        # Filter out exceptions and format results
        sources = []
        for result in results:
            if isinstance(result, dict):
                sources.append(result)
            else:
                sources.append({
                    'success': False,
                    'error': str(result)
                })
        
        # Calculate total
        total_results = 0
        for source in sources:
            if source.get('success'):
                scams = source.get('total_scams', 0)
                if isinstance(scams, str) and scams.isdigit():
                    total_results += int(scams)
                elif isinstance(scams, int):
                    total_results += scams
        
        return {
            'success': any(s.get('success') for s in sources),
            'keyword': keyword,
            'total_results': total_results,
            'sources': sources
        }


# Singleton instance
crawler_service = CrawlerService()
